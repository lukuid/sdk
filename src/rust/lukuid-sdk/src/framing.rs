// SPDX-License-Identifier: Apache-2.0
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use serde_json::{json, Map, Number, Value};

const MAGIC: [u8; 8] = [0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E];
const MAX_FRAME_LEN: usize = 10 * 1024 * 1024;

const WIRE_VARINT: u8 = 0;
const WIRE_FIXED64: u8 = 1;
const WIRE_LENGTH_DELIMITED: u8 = 2;
const WIRE_FIXED32: u8 = 5;

pub struct LukuDecoder {
    buffer: Vec<u8>,
}

impl LukuDecoder {
    pub fn new() -> Self {
        Self { buffer: Vec::new() }
    }

    pub fn feed(&mut self, chunk: &[u8]) -> Vec<Value> {
        self.buffer.extend_from_slice(chunk);
        self.scan()
    }

    fn scan(&mut self) -> Vec<Value> {
        let mut frames = Vec::new();
        let mut consumed = 0usize;
        let len = self.buffer.len();

        loop {
            if len.saturating_sub(consumed) < MAGIC.len() {
                break;
            }

            let Some(start) = find_magic(&self.buffer, consumed) else {
                consumed = len.saturating_sub(MAGIC.len().saturating_sub(1));
                break;
            };

            consumed = start;

            if len.saturating_sub(consumed) < MAGIC.len() + 4 {
                break;
            }

            let length_offset = consumed + MAGIC.len();
            let payload_len = u32::from_le_bytes(
                self.buffer[length_offset..length_offset + 4]
                    .try_into()
                    .unwrap(),
            ) as usize;

            if payload_len > MAX_FRAME_LEN {
                consumed += 1;
                continue;
            }

            let frame_len = MAGIC.len() + 4 + payload_len + MAGIC.len();
            if len.saturating_sub(consumed) < frame_len {
                break;
            }

            let trailer_start = consumed + MAGIC.len() + 4 + payload_len;
            if self.buffer[trailer_start..trailer_start + MAGIC.len()] != MAGIC {
                consumed += 1;
                continue;
            }

            let payload = &self.buffer[length_offset + 4..length_offset + 4 + payload_len];
            if let Some(frame) = decode_command_response(payload) {
                frames.push(frame);
            }

            consumed += frame_len;
        }

        if consumed > 0 {
            if consumed >= self.buffer.len() {
                self.buffer.clear();
            } else {
                self.buffer.drain(0..consumed);
            }
        }

        frames
    }

    pub fn encode(frame: &Value) -> Vec<u8> {
        let payload = match encode_command_request(frame) {
            Some(payload) => payload,
            None => return Vec::new(),
        };

        let mut out = Vec::with_capacity(MAGIC.len() + 4 + payload.len() + MAGIC.len());
        out.extend_from_slice(&MAGIC);
        out.extend_from_slice(&(payload.len() as u32).to_le_bytes());
        out.extend_from_slice(&payload);
        out.extend_from_slice(&MAGIC);
        out
    }
}

fn find_magic(buf: &[u8], start: usize) -> Option<usize> {
    if buf.len().saturating_sub(start) < MAGIC.len() {
        return None;
    }

    (start..=buf.len() - MAGIC.len()).find(|idx| buf[*idx..*idx + MAGIC.len()] == MAGIC)
}

fn encode_command_request(input: &Value) -> Option<Vec<u8>> {
    let record = input.as_object()?;
    let action = record.get("action")?.as_str()?;
    let source = record
        .get("opts")
        .and_then(Value::as_object)
        .unwrap_or(record);

    let mut out = Vec::new();
    write_string(&mut out, 1, action);

    let mut nested = Vec::new();
    match action {
        "fetch" | "history" => {
            if let Some(query) = first_string(source, &["query", "id", "device_id"]) {
                write_string(&mut nested, 1, &query);
            }
            if let Some(offset) = as_u32(source.get("offset")) {
                write_u32(&mut nested, 2, offset);
            }
            if let Some(limit) = as_u32(source.get("limit")) {
                write_u32(&mut nested, 3, limit);
            }
            if let Some(fetch_full) = source.get("fetch_full").and_then(Value::as_bool) {
                write_bool(&mut nested, 4, fetch_full);
            }
            if let Some(starts) = as_i64(source.get("starts")) {
                write_i64(&mut nested, 5, starts);
            }
            if let Some(ends) = as_i64(source.get("ends")) {
                write_i64(&mut nested, 6, ends);
            }
            if let Some(window) = as_fetch_window(source.get("window")) {
                write_u32(&mut nested, 7, window);
            }
            write_message(&mut out, 2, &nested);
        }
        "get" => {
            if let Some(record_id) = first_string(source, &["record_id", "id", "device_id"]) {
                write_string(&mut nested, 1, &record_id);
            }
            write_message(&mut out, 3, &nested);
        }
        "attest" => {
            if let Some(v) = first_string(source, &["parent_record_id", "record_id", "id"]) {
                write_string(&mut nested, 1, &v);
            }
            if let Some(v) = source.get("signature").and_then(as_bytes) {
                write_bytes(&mut nested, 2, &v);
            }
            if let Some(v) = source.get("checksum").and_then(Value::as_str) {
                write_string(&mut nested, 3, v);
            }
            if let Some(v) = source.get("mime").and_then(Value::as_str) {
                write_string(&mut nested, 5, v);
            }
            if let Some(v) = source.get("type").and_then(Value::as_str) {
                write_string(&mut nested, 6, v);
            }
            if let Some(v) = source.get("title").and_then(Value::as_str) {
                write_string(&mut nested, 7, v);
            }
            if let Some(v) = as_f64(source.get("lat")) {
                write_f64(&mut nested, 8, v);
            }
            if let Some(v) = as_f64(source.get("lng")) {
                write_f64(&mut nested, 9, v);
            }
            if let Some(v) = source.get("content").and_then(Value::as_str) {
                write_string(&mut nested, 10, v);
            }
            if let Some(v) = source.get("merkle_root").and_then(Value::as_str) {
                write_string(&mut nested, 11, v);
            }
            if let Some(v) = source.get("custody_id").and_then(Value::as_str) {
                write_string(&mut nested, 12, v);
            }
            if let Some(v) = source.get("event").and_then(Value::as_str) {
                write_string(&mut nested, 13, v);
            }
            if let Some(v) = source.get("status").and_then(Value::as_str) {
                write_string(&mut nested, 14, v);
            }
            if let Some(v) = source.get("context_ref").and_then(Value::as_str) {
                write_string(&mut nested, 15, v);
            }
            write_message(&mut out, 4, &nested);
        }
        "config" | "configure" => {
            if let Some(v) = source.get("name").and_then(Value::as_str) {
                write_string(&mut nested, 1, v);
            }
            if let Some(v) = source.get("wifi_ssid").and_then(Value::as_str) {
                write_string(&mut nested, 2, v);
            }
            if let Some(v) = source.get("wifi_password").and_then(Value::as_str) {
                write_string(&mut nested, 3, v);
            }
            if let Some(v) = source.get("mqtt_broker_url").and_then(Value::as_str) {
                write_string(&mut nested, 4, v);
            }
            if let Some(v) = as_u32(source.get("mqtt_port")) {
                write_u32(&mut nested, 5, v);
            }
            if let Some(v) = source.get("mqtt_topic").and_then(Value::as_str) {
                write_string(&mut nested, 6, v);
            }
            if let Some(v) = as_u32(source.get("mqtt_broadcast_frequency_seconds")) {
                write_u32(&mut nested, 7, v);
            }
            if let Some(v) = source.get("mqtt_username").and_then(Value::as_str) {
                write_string(&mut nested, 8, v);
            }
            if let Some(v) = source.get("mqtt_password").and_then(Value::as_str) {
                write_string(&mut nested, 9, v);
            }
            if let Some(v) = source.get("mqtt_certificate_der").and_then(as_bytes) {
                write_bytes(&mut nested, 10, &v);
            }
            if let Some(v) = source.get("mqtt_ca_der").and_then(as_bytes) {
                write_bytes(&mut nested, 11, &v);
            }
            if let Some(v) = source
                .get("mqtt_broadcast_enabled")
                .and_then(Value::as_bool)
            {
                write_bool(&mut nested, 12, v);
            }
            if let Some(v) = source.get("custom_heartbeat_url").and_then(Value::as_str) {
                write_string(&mut nested, 13, v);
            }
            if let Some(v) = source.get("telemetry_enabled").and_then(Value::as_bool) {
                write_bool(&mut nested, 14, v);
            }
            write_message(&mut out, 5, &nested);
        }
        "ota_begin" => {
            if let Some(v) = as_u32(source.get("size")) {
                write_u32(&mut nested, 1, v);
            }
            if let Some(v) = source.get("public_key").and_then(as_bytes) {
                write_bytes(&mut nested, 2, &v);
            }
            if let Some(v) = source.get("binary_mode").and_then(Value::as_bool) {
                write_bool(&mut nested, 3, v);
            }
            write_message(&mut out, 6, &nested);
        }
        "ota_data" => {
            if let Some(v) = source.get("data").and_then(as_bytes) {
                write_bytes(&mut nested, 1, &v);
            }
            if let Some(v) = as_u32(source.get("offset")) {
                write_u32(&mut nested, 2, v);
            }
            write_message(&mut out, 7, &nested);
        }
        "ota_end" => {
            if let Some(v) = source.get("signature").and_then(as_bytes) {
                write_bytes(&mut nested, 1, &v);
            }
            write_message(&mut out, 8, &nested);
        }
        "set_attestation" => {
            if let Some(v) = source.get("dac_der").and_then(as_bytes) {
                write_bytes(&mut nested, 1, &v);
            }
            if let Some(v) = source
                .get("manufacturer_der")
                .or_else(|| source.get("functional_der"))
                .and_then(as_bytes)
            {
                write_bytes(&mut nested, 2, &v);
            }
            if let Some(v) = source.get("signature").and_then(as_bytes) {
                write_bytes(&mut nested, 3, &v);
            }
            if let Some(v) = as_u64(source.get("counter")) {
                write_u64(&mut nested, 4, v);
            }
            if let Some(v) = source.get("nonce").and_then(Value::as_str) {
                write_string(&mut nested, 5, v);
            }
            if let Some(v) = source.get("intermediate_der").and_then(as_bytes) {
                write_bytes(&mut nested, 6, &v);
            }
            write_message(&mut out, 9, &nested);
        }
        "set_heartbeat" => {
            if let Some(v) = source.get("slac_der").and_then(as_bytes) {
                write_bytes(&mut nested, 1, &v);
            }
            if let Some(v) = source.get("heartbeat_der").and_then(as_bytes) {
                write_bytes(&mut nested, 2, &v);
            }
            if let Some(v) = source.get("signature").and_then(as_bytes) {
                write_bytes(&mut nested, 3, &v);
            }
            if let Some(v) = as_i64(source.get("timestamp")) {
                write_i64(&mut nested, 4, v);
            }
            if let Some(v) = source.get("intermediate_der").and_then(as_bytes) {
                write_bytes(&mut nested, 5, &v);
            }
            write_message(&mut out, 10, &nested);
        }
        "scan_enable" => {
            if let Some(v) = source.get("enabled").and_then(Value::as_bool) {
                write_bool(&mut nested, 1, v);
            }
            write_message(&mut out, 12, &nested);
        }
        "generate_heartbeat" => {
            write_message(&mut out, 13, &nested);
        }
        "fetch_telemetry" => {
            write_message(&mut out, 14, &nested);
        }
        _ => {}
    }

    Some(out)
}

fn decode_command_response(bytes: &[u8]) -> Option<Value> {
    let mut cursor = 0usize;
    let mut out = Map::new();
    let mut saw_status = false;
    let mut saw_success = false;

    while cursor < bytes.len() {
        let key = read_varint(bytes, &mut cursor)?;
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => insert_string(bytes, &mut cursor, wire_type, &mut out, "action")?,
            2 => {
                let raw = read_varint_field(bytes, &mut cursor, wire_type)?;
                saw_status = true;
                out.insert(
                    "status".to_string(),
                    Value::String(status_name(raw).to_string()),
                );
            }
            3 => {
                saw_success = true;
                insert_bool(bytes, &mut cursor, wire_type, &mut out, "success")?
            }
            4 => insert_string(bytes, &mut cursor, wire_type, &mut out, "error_code")?,
            5 => insert_string(bytes, &mut cursor, wire_type, &mut out, "message")?,
            6 => {
                let message = read_length_delimited(bytes, &mut cursor, wire_type)?;
                let info = decode_device_info_response(message)?;
                if let Some(obj) = info.as_object() {
                    out.extend(obj.clone());
                }
            }
            7 => {
                let message = read_length_delimited(bytes, &mut cursor, wire_type)?;
                let config = decode_network_config_response(message)?;
                if let Some(obj) = config.as_object() {
                    out.extend(obj.clone());
                }
            }
            8 => {
                let message = read_length_delimited(bytes, &mut cursor, wire_type)?;
                let record = decode_scan_record(message);
                out.insert("scan_record".to_string(), record);
            }
            9 => {
                let message = read_length_delimited(bytes, &mut cursor, wire_type)?;
                let record = decode_environment_record(message);
                out.insert("env_record".to_string(), record);
            }
            10 => {
                let message = read_length_delimited(bytes, &mut cursor, wire_type)?;
                let data = decode_fetch_response(message);
                out.insert("data".to_string(), Value::Array(data));
            }
            11 => {
                let message = read_length_delimited(bytes, &mut cursor, wire_type)?;
                let response = decode_full_record_response(message);
                out.insert("full_record_response".to_string(), response);
            }
            15 => {
                let message = read_length_delimited(bytes, &mut cursor, wire_type)?;
                let batches = decode_record_batches(message);
                out.insert("record_batches".to_string(), batches);
            }
            16 => {
                let message = read_length_delimited(bytes, &mut cursor, wire_type)?;
                let status = decode_status_response(message)?;
                if let Some(obj) = status.as_object() {
                    out.extend(obj.clone());
                }
            }
            17 => {
                let message = read_length_delimited(bytes, &mut cursor, wire_type)?;
                let telemetry = decode_fetch_telemetry_response(message);
                out.insert("data".to_string(), Value::Array(telemetry));
            }
            18 => insert_bool(bytes, &mut cursor, wire_type, &mut out, "has_more")?,
            14 => {
                let message = read_length_delimited(bytes, &mut cursor, wire_type)?;
                let heartbeat = decode_heartbeat_init_response(message)?;
                out.extend(heartbeat);
            }
            12 => insert_bytes(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "response_signature",
            )?,
            13 => insert_bytes(bytes, &mut cursor, wire_type, &mut out, "response_key")?,
            _ => skip_field(bytes, &mut cursor, wire_type)?,
        }
    }

    if !saw_status && !saw_success {
        return None;
    }

    let success_val = out.get("success").and_then(Value::as_bool);
    let status_val = out.get("status").and_then(Value::as_str);
    let has_error = out.contains_key("error_code") || (status_val == Some("STATUS_ERROR"));

    let success = success_val.unwrap_or(!has_error);
    out.insert("ok".to_string(), Value::Bool(success));

    // Ensure 'fetch' actions always have a data array even if empty
    if let Some(Value::String(action)) = out.get("action") {
        if action == "fetch" && !out.contains_key("data") {
            out.insert("data".to_string(), Value::Array(Vec::new()));
        }
    }

    if !success {
        let code = out
            .get("error_code")
            .and_then(Value::as_str)
            .unwrap_or("DEVICE_ERROR")
            .to_string();
        let message = out
            .get("message")
            .and_then(Value::as_str)
            .unwrap_or(&code)
            .to_string();
        out.insert(
            "err".to_string(),
            json!({
                "code": code,
                "msg": message,
            }),
        );
        out.insert("error".to_string(), Value::String(message));
    }

    Some(Value::Object(out))
}

fn decode_fetch_response(bytes: &[u8]) -> Vec<Value> {
    let mut cursor = 0usize;
    let mut items = Vec::new();

    while cursor < bytes.len() {
        let Some(key) = read_varint(bytes, &mut cursor) else {
            break;
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        if field == 1 && wire_type == WIRE_LENGTH_DELIMITED {
            let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) else {
                break;
            };
            if let Some(entry) = decode_data_entry(message) {
                items.push(entry);
            }
            continue;
        }

        if skip_field(bytes, &mut cursor, wire_type).is_none() {
            break;
        }
    }

    items
}

fn decode_data_entry(bytes: &[u8]) -> Option<Value> {
    let mut cursor = 0usize;

    while cursor < bytes.len() {
        let key = read_varint(bytes, &mut cursor)?;
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;
        let message = read_length_delimited(bytes, &mut cursor, wire_type)?;

        match field {
            1 => {
                return Some(json!({
                    "view": "animalreader_list",
                    "type": "scan_min",
                    "record": decode_scan_record_min(message),
                }));
            }
            2 => {
                return Some(json!({
                    "view": "guardcard_list",
                    "type": "environment_min",
                    "record": decode_environment_record_min(message),
                }));
            }
            _ => {}
        }
    }

    None
}

fn decode_scan_record_min(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let Some(key) = read_varint(bytes, &mut cursor) else {
            break;
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                if let Some(value) = read_string_field(bytes, &mut cursor, wire_type) {
                    out.insert("version".to_string(), Value::String(value));
                } else {
                    break;
                }
            }
            2 => {
                if let Some(value) = read_string_field(bytes, &mut cursor, wire_type) {
                    out.insert("record_id".to_string(), Value::String(value));
                } else {
                    break;
                }
            }
            3 => {
                if let Some(value) = read_i64_field(bytes, &mut cursor, wire_type) {
                    out.insert(
                        "timestamp_utc".to_string(),
                        Value::Number(Number::from(value)),
                    );
                } else {
                    break;
                }
            }
            4 => {
                if let Some(value) = read_string_field(bytes, &mut cursor, wire_type) {
                    out.insert("tag_id".to_string(), Value::String(value));
                } else {
                    break;
                }
            }
            5 => {
                if insert_u32(bytes, &mut cursor, wire_type, &mut out, "score_bio").is_none() {
                    cursor = bytes.len();
                }
            }
            6 => {
                if insert_u32(bytes, &mut cursor, wire_type, &mut out, "score_auth").is_none() {
                    cursor = bytes.len();
                }
            }
            7 => {
                if insert_u32(bytes, &mut cursor, wire_type, &mut out, "score_env").is_none() {
                    cursor = bytes.len();
                }
            }
            _ => {
                if skip_field(bytes, &mut cursor, wire_type).is_none() {
                    cursor = bytes.len();
                }
            }
        }
    }

    Value::Object(out)
}

fn decode_environment_record_min(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let Some(key) = read_varint(bytes, &mut cursor) else {
            break;
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                if let Some(value) = read_string_field(bytes, &mut cursor, wire_type) {
                    out.insert("version".to_string(), Value::String(value));
                } else {
                    break;
                }
            }
            2 => {
                if let Some(value) = read_string_field(bytes, &mut cursor, wire_type) {
                    out.insert("record_id".to_string(), Value::String(value));
                } else {
                    break;
                }
            }
            3 => {
                if let Some(value) = read_i64_field(bytes, &mut cursor, wire_type) {
                    out.insert(
                        "timestamp_utc".to_string(),
                        Value::Number(Number::from(value)),
                    );
                } else {
                    break;
                }
            }
            4 => {
                if insert_metric_value(bytes, &mut cursor, wire_type, &mut out, "lux").is_none() {
                    cursor = bytes.len();
                }
            }
            5 => {
                if insert_metric_value(bytes, &mut cursor, wire_type, &mut out, "temp_c").is_none()
                {
                    cursor = bytes.len();
                }
            }
            6 => {
                if insert_metric_value(bytes, &mut cursor, wire_type, &mut out, "humidity_pct")
                    .is_none()
                {
                    cursor = bytes.len();
                }
            }
            7 => {
                if insert_metric_value(bytes, &mut cursor, wire_type, &mut out, "voc_index")
                    .is_none()
                {
                    cursor = bytes.len();
                }
            }
            8 => {
                if insert_bool(bytes, &mut cursor, wire_type, &mut out, "tamper").is_none() {
                    cursor = bytes.len();
                }
            }
            9 => {
                if insert_bool(bytes, &mut cursor, wire_type, &mut out, "wake_event").is_none() {
                    cursor = bytes.len();
                }
            }
            10 => {
                if insert_bool(bytes, &mut cursor, wire_type, &mut out, "vbus_present").is_none() {
                    cursor = bytes.len();
                }
            }
            _ => {
                if skip_field(bytes, &mut cursor, wire_type).is_none() {
                    cursor = bytes.len();
                }
            }
        }
    }

    Value::Object(out)
}

fn insert_metric_value(
    bytes: &[u8],
    cursor: &mut usize,
    wire_type: u8,
    out: &mut Map<String, Value>,
    key: &str,
) -> Option<()> {
    let message = read_length_delimited(bytes, cursor, wire_type)?;
    let value = decode_metric_value(message)?;
    out.insert(key.to_string(), value);
    Some(())
}

fn decode_metric_value(bytes: &[u8]) -> Option<Value> {
    let mut cursor = 0usize;

    while cursor < bytes.len() {
        let key = read_varint(bytes, &mut cursor)?;
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                return Some(Value::Number(number_from_f64(read_f32_field(
                    bytes,
                    &mut cursor,
                    wire_type,
                )? as f64)));
            }
            2 => {
                let message = read_length_delimited(bytes, &mut cursor, wire_type)?;
                return Some(decode_metric_stats(message));
            }
            _ => skip_field(bytes, &mut cursor, wire_type)?,
        }
    }

    None
}

fn decode_metric_stats(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let Some(key) = read_varint(bytes, &mut cursor) else {
            break;
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                if insert_f32(bytes, &mut cursor, wire_type, &mut out, "avg").is_none() {
                    cursor = bytes.len();
                }
            }
            2 => {
                if insert_f32(bytes, &mut cursor, wire_type, &mut out, "min").is_none() {
                    cursor = bytes.len();
                }
            }
            3 => {
                if insert_f32(bytes, &mut cursor, wire_type, &mut out, "max").is_none() {
                    cursor = bytes.len();
                }
            }
            4 => {
                if insert_f32(bytes, &mut cursor, wire_type, &mut out, "variance").is_none() {
                    cursor = bytes.len();
                }
            }
            5 => {
                if insert_u32(bytes, &mut cursor, wire_type, &mut out, "count").is_none() {
                    cursor = bytes.len();
                }
            }
            _ => {
                if skip_field(bytes, &mut cursor, wire_type).is_none() {
                    cursor = bytes.len();
                }
            }
        }
    }

    Value::Object(out)
}

fn insert_string(
    bytes: &[u8],
    cursor: &mut usize,
    wire_type: u8,
    out: &mut Map<String, Value>,
    key: &str,
) -> Option<()> {
    let value = read_string_field(bytes, cursor, wire_type)?;
    out.insert(key.to_string(), Value::String(value));
    Some(())
}

fn insert_bool(
    bytes: &[u8],
    cursor: &mut usize,
    wire_type: u8,
    out: &mut Map<String, Value>,
    key: &str,
) -> Option<()> {
    let value = read_varint_field(bytes, cursor, wire_type)? != 0;
    out.insert(key.to_string(), Value::Bool(value));
    Some(())
}

fn insert_u32(
    bytes: &[u8],
    cursor: &mut usize,
    wire_type: u8,
    out: &mut Map<String, Value>,
    key: &str,
) -> Option<()> {
    let value = read_varint_field(bytes, cursor, wire_type)? as u32;
    out.insert(key.to_string(), Value::Number(Number::from(value)));
    Some(())
}

fn insert_u64(
    bytes: &[u8],
    cursor: &mut usize,
    wire_type: u8,
    out: &mut Map<String, Value>,
    key: &str,
) -> Option<()> {
    let value = read_varint_field(bytes, cursor, wire_type)?;
    out.insert(key.to_string(), Value::Number(Number::from(value)));
    Some(())
}

fn insert_i64(
    bytes: &[u8],
    cursor: &mut usize,
    wire_type: u8,
    out: &mut Map<String, Value>,
    key: &str,
) -> Option<()> {
    let value = read_i64_field(bytes, cursor, wire_type)?;
    out.insert(key.to_string(), Value::Number(Number::from(value)));
    Some(())
}

fn insert_f32(
    bytes: &[u8],
    cursor: &mut usize,
    wire_type: u8,
    out: &mut Map<String, Value>,
    key: &str,
) -> Option<()> {
    let value = read_f32_field(bytes, cursor, wire_type)?;
    out.insert(
        key.to_string(),
        Value::Number(number_from_f64(value as f64)),
    );
    Some(())
}

fn insert_f64(
    bytes: &[u8],
    cursor: &mut usize,
    wire_type: u8,
    out: &mut Map<String, Value>,
    key: &str,
) -> Option<()> {
    let value = read_f64_field(bytes, cursor, wire_type)?;
    out.insert(key.to_string(), Value::Number(number_from_f64(value)));
    Some(())
}

fn read_varint_field(bytes: &[u8], cursor: &mut usize, wire_type: u8) -> Option<u64> {
    if wire_type != WIRE_VARINT {
        return None;
    }
    read_varint(bytes, cursor)
}

fn read_i64_field(bytes: &[u8], cursor: &mut usize, wire_type: u8) -> Option<i64> {
    Some(read_varint_field(bytes, cursor, wire_type)? as i64)
}

fn read_f32_field(bytes: &[u8], cursor: &mut usize, wire_type: u8) -> Option<f32> {
    if wire_type != WIRE_FIXED32 || bytes.len().saturating_sub(*cursor) < 4 {
        return None;
    }
    let value = f32::from_bits(u32::from_le_bytes(
        bytes[*cursor..*cursor + 4].try_into().ok()?,
    ));
    *cursor += 4;
    Some(value)
}

fn read_f64_field(bytes: &[u8], cursor: &mut usize, wire_type: u8) -> Option<f64> {
    if wire_type != WIRE_FIXED64 || bytes.len().saturating_sub(*cursor) < 8 {
        return None;
    }
    let value = f64::from_bits(u64::from_le_bytes(
        bytes[*cursor..*cursor + 8].try_into().ok()?,
    ));
    *cursor += 8;
    Some(value)
}

fn read_string_field(bytes: &[u8], cursor: &mut usize, wire_type: u8) -> Option<String> {
    let raw = read_length_delimited(bytes, cursor, wire_type)?;
    String::from_utf8(raw.to_vec()).ok()
}

fn read_length_delimited<'a>(
    bytes: &'a [u8],
    cursor: &mut usize,
    wire_type: u8,
) -> Option<&'a [u8]> {
    if wire_type != WIRE_LENGTH_DELIMITED {
        return None;
    }

    let len = read_varint(bytes, cursor)? as usize;
    if bytes.len().saturating_sub(*cursor) < len {
        return None;
    }

    let start = *cursor;
    *cursor += len;
    Some(&bytes[start..start + len])
}

fn skip_field(bytes: &[u8], cursor: &mut usize, wire_type: u8) -> Option<()> {
    match wire_type {
        WIRE_VARINT => {
            read_varint(bytes, cursor)?;
        }
        WIRE_FIXED64 => {
            if bytes.len().saturating_sub(*cursor) < 8 {
                return None;
            }
            *cursor += 8;
        }
        WIRE_LENGTH_DELIMITED => {
            let len = read_varint(bytes, cursor)? as usize;
            if bytes.len().saturating_sub(*cursor) < len {
                return None;
            }
            *cursor += len;
        }
        WIRE_FIXED32 => {
            if bytes.len().saturating_sub(*cursor) < 4 {
                return None;
            }
            *cursor += 4;
        }
        _ => return None,
    }

    Some(())
}

fn read_varint(bytes: &[u8], cursor: &mut usize) -> Option<u64> {
    let mut shift = 0u32;
    let mut out = 0u64;

    for _ in 0..10 {
        let byte = *bytes.get(*cursor)?;
        *cursor += 1;

        out |= ((byte & 0x7F) as u64) << shift;
        if byte & 0x80 == 0 {
            return Some(out);
        }

        shift += 7;
    }

    None
}

fn write_key(out: &mut Vec<u8>, field: u32, wire_type: u8) {
    write_varint(out, ((field as u64) << 3) | wire_type as u64);
}

fn write_varint(out: &mut Vec<u8>, mut value: u64) {
    loop {
        if value < 0x80 {
            out.push(value as u8);
            return;
        }

        out.push(((value as u8) & 0x7F) | 0x80);
        value >>= 7;
    }
}

fn write_bool(out: &mut Vec<u8>, field: u32, value: bool) {
    write_key(out, field, WIRE_VARINT);
    write_varint(out, if value { 1 } else { 0 });
}

fn write_u32(out: &mut Vec<u8>, field: u32, value: u32) {
    write_key(out, field, WIRE_VARINT);
    write_varint(out, value as u64);
}

fn write_u64(out: &mut Vec<u8>, field: u32, value: u64) {
    write_key(out, field, WIRE_VARINT);
    write_varint(out, value);
}

fn write_i64(out: &mut Vec<u8>, field: u32, value: i64) {
    write_key(out, field, WIRE_VARINT);
    write_varint(out, value as u64);
}

fn write_f64(out: &mut Vec<u8>, field: u32, value: f64) {
    write_key(out, field, WIRE_FIXED64);
    out.extend_from_slice(&value.to_bits().to_le_bytes());
}

fn write_string(out: &mut Vec<u8>, field: u32, value: &str) {
    write_key(out, field, WIRE_LENGTH_DELIMITED);
    write_varint(out, value.len() as u64);
    out.extend_from_slice(value.as_bytes());
}

fn write_bytes(out: &mut Vec<u8>, field: u32, value: &[u8]) {
    write_key(out, field, WIRE_LENGTH_DELIMITED);
    write_varint(out, value.len() as u64);
    out.extend_from_slice(value);
}

fn write_message(out: &mut Vec<u8>, field: u32, value: &[u8]) {
    write_key(out, field, WIRE_LENGTH_DELIMITED);
    write_varint(out, value.len() as u64);
    out.extend_from_slice(value);
}

fn as_u32(value: Option<&Value>) -> Option<u32> {
    let value = value?;
    value
        .as_u64()
        .and_then(|value| u32::try_from(value).ok())
        .or_else(|| value.as_i64().and_then(|value| u32::try_from(value).ok()))
}

fn as_u64(value: Option<&Value>) -> Option<u64> {
    let value = value?;
    value
        .as_u64()
        .or_else(|| value.as_i64().and_then(|value| u64::try_from(value).ok()))
}

fn as_i64(value: Option<&Value>) -> Option<i64> {
    let value = value?;
    value
        .as_i64()
        .or_else(|| value.as_u64().and_then(|value| i64::try_from(value).ok()))
}

fn as_f64(value: Option<&Value>) -> Option<f64> {
    let value = value?;
    value
        .as_f64()
        .or_else(|| value.as_i64().map(|value| value as f64))
        .or_else(|| value.as_u64().map(|value| value as f64))
}

fn as_fetch_window(value: Option<&Value>) -> Option<u32> {
    let value = value?;
    if let Some(number) = as_u32(Some(value)) {
        return Some(number);
    }

    let name = value.as_str()?.trim().to_ascii_lowercase();
    match name.as_str() {
        "none" | "fetch_window_none" => Some(0),
        "hourly" | "fetch_window_hourly" => Some(1),
        "daily" | "fetch_window_daily" => Some(2),
        "weekly" | "fetch_window_weekly" => Some(3),
        "monthly" | "fetch_window_monthly" => Some(4),
        _ => None,
    }
}

fn as_bytes(value: &Value) -> Option<Vec<u8>> {
    if let Some(s) = value.as_str() {
        if s.starts_with("-----BEGIN") {
            return Some(s.as_bytes().to_vec());
        }
        if let Ok(b) = BASE64.decode(s.trim()) {
            return Some(b);
        }
        return Some(s.as_bytes().to_vec());
    }
    if let Some(arr) = value.as_array() {
        let mut out = Vec::new();
        for v in arr {
            out.push(v.as_u64()? as u8);
        }
        return Some(out);
    }
    None
}

fn first_string(source: &Map<String, Value>, keys: &[&str]) -> Option<String> {
    for key in keys {
        if let Some(Value::String(s)) = source.get(*key) {
            if !s.is_empty() {
                return Some(s.clone());
            }
        }
    }
    None
}

fn number_from_f64(value: f64) -> Number {
    Number::from_f64(value).unwrap_or_else(|| Number::from(0))
}

fn status_name(value: u64) -> &'static str {
    match value {
        1 => "STATUS_OK",
        2 => "STATUS_ERROR",
        3 => "STATUS_READY",
        _ => "STATUS_UNKNOWN",
    }
}

fn decode_status_response(bytes: &[u8]) -> Option<Value> {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let key = read_varint(bytes, &mut cursor)?;
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => insert_string(bytes, &mut cursor, wire_type, &mut out, "id")?,
            2 => insert_string(bytes, &mut cursor, wire_type, &mut out, "name")?,
            3 => insert_bytes(bytes, &mut cursor, wire_type, &mut out, "public_key")?,
            4 => insert_f32(bytes, &mut cursor, wire_type, &mut out, "battery_health")?,
            5 => insert_i64(bytes, &mut cursor, wire_type, &mut out, "timestamp")?,
            6 => insert_bool(bytes, &mut cursor, wire_type, &mut out, "has_attestation")?,
            7 => insert_bool(bytes, &mut cursor, wire_type, &mut out, "has_heartbeat")?,
            8 => insert_bool(bytes, &mut cursor, wire_type, &mut out, "needs_sync")?,
            9 => insert_string(bytes, &mut cursor, wire_type, &mut out, "product")?,
            10 => insert_string(bytes, &mut cursor, wire_type, &mut out, "model")?,
            _ => skip_field(bytes, &mut cursor, wire_type)?,
        }
    }

    Some(Value::Object(out))
}

fn decode_device_info_response(bytes: &[u8]) -> Option<Value> {
    let mut cursor = 0usize;
    let mut out = Map::new();
    while cursor < bytes.len() {
        let key = read_varint(bytes, &mut cursor)?;
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;
        match field {
            1 => insert_string(bytes, &mut cursor, wire_type, &mut out, "handshake")?,
            2 => insert_i64(bytes, &mut cursor, wire_type, &mut out, "uptime_ms")?,
            3 => insert_bytes(bytes, &mut cursor, wire_type, &mut out, "token")?,
            4 => insert_f32(bytes, &mut cursor, wire_type, &mut out, "battery")?,
            5 => insert_f32(bytes, &mut cursor, wire_type, &mut out, "voltage")?,
            6 => insert_bool(bytes, &mut cursor, wire_type, &mut out, "vbus")?,
            7 => insert_f64(bytes, &mut cursor, wire_type, &mut out, "counter")?,
            8 => insert_bool(bytes, &mut cursor, wire_type, &mut out, "sync_required")?,
            9 => insert_string(bytes, &mut cursor, wire_type, &mut out, "name")?,
            10 => insert_string(bytes, &mut cursor, wire_type, &mut out, "id")?,
            11 => insert_string(bytes, &mut cursor, wire_type, &mut out, "product")?,
            12 => insert_string(bytes, &mut cursor, wire_type, &mut out, "model")?,
            13 => insert_string(bytes, &mut cursor, wire_type, &mut out, "firmware")?,
            14 => insert_string(bytes, &mut cursor, wire_type, &mut out, "revision")?,
            15 => insert_bool(bytes, &mut cursor, wire_type, &mut out, "pairing")?,
            16 => insert_string(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "custom_heartbeat_url",
            )?,
            17 => insert_bool(bytes, &mut cursor, wire_type, &mut out, "telemetry")?,
            18 => insert_string(bytes, &mut cursor, wire_type, &mut out, "managed_by")?,
            19 => insert_bytes(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "attestation_dac_der",
            )?,
            20 => insert_bytes(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "attestation_manufacturer_der",
            )?,
            21 => insert_bytes(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "attestation_intermediate_der",
            )?,
            22 => insert_string(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "attestation_root_fingerprint",
            )?,
            23 => insert_bytes(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "heartbeat_slac_der",
            )?,
            24 => insert_bytes(bytes, &mut cursor, wire_type, &mut out, "heartbeat_der")?,
            25 => insert_bytes(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "heartbeat_intermediate_der",
            )?,
            26 => insert_string(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "heartbeat_root_fingerprint",
            )?,
            27 => insert_bytes(bytes, &mut cursor, wire_type, &mut out, "signature")?,
            28 => insert_bytes(bytes, &mut cursor, wire_type, &mut out, "key")?,
            _ => skip_field(bytes, &mut cursor, wire_type)?,
        }
    }
    Some(Value::Object(out))
}

fn decode_network_config_response(bytes: &[u8]) -> Option<Value> {
    let mut cursor = 0usize;
    let mut out = Map::new();
    while cursor < bytes.len() {
        let key = read_varint(bytes, &mut cursor)?;
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;
        match field {
            1 => insert_string(bytes, &mut cursor, wire_type, &mut out, "wifi_ssid")?,
            2 => insert_bool(bytes, &mut cursor, wire_type, &mut out, "wifi_password_set")?,
            3 => insert_string(bytes, &mut cursor, wire_type, &mut out, "mqtt_broker_url")?,
            4 => insert_u32(bytes, &mut cursor, wire_type, &mut out, "mqtt_port")?,
            5 => insert_string(bytes, &mut cursor, wire_type, &mut out, "mqtt_topic")?,
            6 => insert_u32(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "mqtt_broadcast_frequency_seconds",
            )?,
            7 => insert_string(bytes, &mut cursor, wire_type, &mut out, "mqtt_username")?,
            8 => insert_bool(bytes, &mut cursor, wire_type, &mut out, "mqtt_password_set")?,
            9 => insert_bool(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "mqtt_broadcast_enabled",
            )?,
            10 => insert_string(bytes, &mut cursor, wire_type, &mut out, "csr")?,
            11 => insert_string(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "mqtt_certificate_der",
            )?,
            12 => insert_string(bytes, &mut cursor, wire_type, &mut out, "mqtt_ca_der")?,
            _ => skip_field(bytes, &mut cursor, wire_type)?,
        }
    }
    Some(Value::Object(out))
}

fn insert_bytes(
    bytes: &[u8],
    cursor: &mut usize,
    wire_type: u8,
    out: &mut Map<String, Value>,
    key: &str,
) -> Option<()> {
    let raw = read_length_delimited(bytes, cursor, wire_type)?;
    out.insert(key.to_string(), Value::String(BASE64.encode(raw)));
    Some(())
}

fn decode_scan_record(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();
    out.insert("type".to_string(), Value::String("scan".to_string()));

    while cursor < bytes.len() {
        let key = match read_varint(bytes, &mut cursor) {
            Some(k) => k,
            None => break,
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "version");
            }
            2 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "scan_id");
            }
            3 => {
                let _ = insert_bytes(bytes, &mut cursor, wire_type, &mut out, "signature");
            }
            4 => {
                let _ = insert_bytes(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "previous_signature",
                );
            }
            5 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "canonical_string");
            }
            6 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    out.insert("payload".to_string(), decode_scan_payload(message));
                }
            }
            7 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    if let Some(device) = decode_record_device_info(message) {
                        out.insert("device".to_string(), device);
                    }
                }
            }
            8 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    if let Some(manufacturer) = decode_manufacturer_info(message) {
                        out.insert("manufacturer".to_string(), manufacturer);
                    }
                }
            }
            9 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    out.entry("attachments".to_string())
                        .or_insert_with(|| Value::Array(Vec::new()))
                        .as_array_mut()
                        .expect("attachments is array")
                        .push(decode_attachment(message));
                }
            }
            10 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    out.insert("identity".to_string(), decode_identity(message));
                }
            }
            11 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "alg");
            }
            _ => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
        }
    }

    Value::Object(out)
}

fn decode_scan_payload(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let key = match read_varint(bytes, &mut cursor) {
            Some(k) => k,
            None => break,
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                let _ = insert_u64(bytes, &mut cursor, wire_type, &mut out, "ctr");
            }
            2 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "id");
            }
            3 => {
                let _ = insert_i64(bytes, &mut cursor, wire_type, &mut out, "timestamp_utc");
            }
            4 => {
                let _ = insert_i64(bytes, &mut cursor, wire_type, &mut out, "uptime_us");
            }
            5 => {
                let _ = insert_f32(bytes, &mut cursor, wire_type, &mut out, "temperature_c");
            }
            6 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "nonce");
            }
            7 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "firmware");
            }
            26 => {
                let _ = insert_u32(bytes, &mut cursor, wire_type, &mut out, "score_bio");
            }
            27 => {
                let _ = insert_u32(bytes, &mut cursor, wire_type, &mut out, "score_auth");
            }
            28 => {
                let _ = insert_u32(bytes, &mut cursor, wire_type, &mut out, "score_env");
            }
            29 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "metrics_keys");
            }
            30 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "scan_version");
            }
            31 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "genesis_hash");
            }
            _ => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
        }
    }

    Value::Object(out)
}

fn decode_environment_record(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();
    out.insert("type".to_string(), Value::String("environment".to_string()));

    while cursor < bytes.len() {
        let key = match read_varint(bytes, &mut cursor) {
            Some(k) => k,
            None => break,
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "version");
            }
            2 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "event_id");
            }
            3 => {
                let _ = insert_bytes(bytes, &mut cursor, wire_type, &mut out, "signature");
            }
            4 => {
                let _ = insert_bytes(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "previous_signature",
                );
            }
            5 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "canonical_string");
            }
            6 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    out.insert("payload".to_string(), decode_environment_payload(message));
                }
            }
            7 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    if let Some(device) = decode_record_device_info(message) {
                        out.insert("device".to_string(), device);
                    }
                }
            }
            8 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    out.entry("attachments".to_string())
                        .or_insert_with(|| Value::Array(Vec::new()))
                        .as_array_mut()
                        .expect("attachments is array")
                        .push(decode_attachment(message));
                }
            }
            9 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    out.insert("identity".to_string(), decode_identity(message));
                }
            }
            10 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "alg");
            }
            _ => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
        }
    }

    Value::Object(out)
}

fn decode_environment_payload(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let key = match read_varint(bytes, &mut cursor) {
            Some(k) => k,
            None => break,
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                let _ = insert_u64(bytes, &mut cursor, wire_type, &mut out, "ctr");
            }
            2 => {
                let _ = insert_i64(bytes, &mut cursor, wire_type, &mut out, "timestamp_utc");
            }
            3 => {
                let _ = insert_i64(bytes, &mut cursor, wire_type, &mut out, "uptime_us");
            }
            4 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "nonce");
            }
            5 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "firmware");
            }
            6 => {
                let _ = insert_f32(bytes, &mut cursor, wire_type, &mut out, "lux");
            }
            7 => {
                let _ = insert_f32(bytes, &mut cursor, wire_type, &mut out, "temp_c");
            }
            8 => {
                let _ = insert_f32(bytes, &mut cursor, wire_type, &mut out, "humidity_pct");
            }
            9 => {
                let _ = insert_f32(bytes, &mut cursor, wire_type, &mut out, "pressure_hpa");
            }
            10 => {
                let _ = insert_u32(bytes, &mut cursor, wire_type, &mut out, "voc_index");
            }
            11 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    let mut acc_cursor = 0usize;
                    let mut acc = Map::new();
                    while acc_cursor < message.len() {
                        let k = match read_varint(message, &mut acc_cursor) {
                            Some(val) => val,
                            None => break,
                        };
                        let f = (k >> 3) as u32;
                        let w = (k & 0x07) as u8;
                        match f {
                            1 => {
                                let _ = insert_f32(message, &mut acc_cursor, w, &mut acc, "x");
                            }
                            2 => {
                                let _ = insert_f32(message, &mut acc_cursor, w, &mut acc, "y");
                            }
                            3 => {
                                let _ = insert_f32(message, &mut acc_cursor, w, &mut acc, "z");
                            }
                            _ => {
                                let _ = skip_field(message, &mut acc_cursor, w);
                            }
                        }
                    }
                    out.insert("accel_g".to_string(), Value::Object(acc));
                }
            }
            12 => {
                let _ = insert_bool(bytes, &mut cursor, wire_type, &mut out, "tamper");
            }
            13 => {
                let _ = insert_bool(bytes, &mut cursor, wire_type, &mut out, "wake_event");
            }
            14 => {
                let _ = insert_bool(bytes, &mut cursor, wire_type, &mut out, "vbus_present");
            }
            15 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "genesis_hash");
            }
            _ => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
        }
    }

    Value::Object(out)
}

fn decode_record_device_info(bytes: &[u8]) -> Option<Value> {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let key = read_varint(bytes, &mut cursor)?;
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => insert_string(bytes, &mut cursor, wire_type, &mut out, "device_id")?,
            2 => insert_bytes(bytes, &mut cursor, wire_type, &mut out, "public_key")?,
            _ => skip_field(bytes, &mut cursor, wire_type)?,
        }
    }

    Some(Value::Object(out))
}

fn decode_manufacturer_info(bytes: &[u8]) -> Option<Value> {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let key = read_varint(bytes, &mut cursor)?;
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => insert_bytes(bytes, &mut cursor, wire_type, &mut out, "signature")?,
            2 => insert_bytes(bytes, &mut cursor, wire_type, &mut out, "public_key")?,
            _ => skip_field(bytes, &mut cursor, wire_type)?,
        }
    }

    Some(Value::Object(out))
}

fn decode_identity(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let Some(key) = read_varint(bytes, &mut cursor) else {
            break;
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                let _ = insert_u64(bytes, &mut cursor, wire_type, &mut out, "identity_version");
            }
            2 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "dac_serial");
            }
            3 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "slac_serial");
            }
            4 => {
                let _ = insert_i64(bytes, &mut cursor, wire_type, &mut out, "last_sync_utc");
            }
            5 => {
                let _ = insert_bytes(bytes, &mut cursor, wire_type, &mut out, "signature");
            }
            6 => {
                let _ = insert_bytes(bytes, &mut cursor, wire_type, &mut out, "dac_der");
            }
            7 => {
                let _ = insert_bytes(bytes, &mut cursor, wire_type, &mut out, "slac_der");
            }
            8 => {
                let _ = insert_bytes(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "attestation_manufacturer_der",
                );
            }
            9 => {
                let _ = insert_bytes(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "attestation_intermediate_der",
                );
            }
            10 => {
                let _ = insert_string(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "attestation_root_fingerprint",
                );
            }
            11 => {
                let _ = insert_bytes(bytes, &mut cursor, wire_type, &mut out, "heartbeat_der");
            }
            12 => {
                let _ = insert_bytes(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "heartbeat_intermediate_der",
                );
            }
            13 => {
                let _ = insert_string(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "heartbeat_root_fingerprint",
                );
            }
            14 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "alg");
            }
            _ => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
        }
    }

    Value::Object(out)
}

fn decode_external_identity(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();
    let mut certs = Vec::new();

    while cursor < bytes.len() {
        let Some(key) = read_varint(bytes, &mut cursor) else {
            break;
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "endorser_id");
            }
            2 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "root_fingerprint");
            }
            3 => {
                if let Some(raw) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    certs.push(Value::String(BASE64.encode(raw)));
                }
            }
            4 => {
                let _ = insert_bytes(bytes, &mut cursor, wire_type, &mut out, "signature");
            }
            _ => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
        }
    }

    if !certs.is_empty() {
        out.insert("cert_chain_der".to_string(), Value::Array(certs));
    }

    Value::Object(out)
}

fn decode_attachment(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let Some(key) = read_varint(bytes, &mut cursor) else {
            break;
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                let _ = insert_bytes(bytes, &mut cursor, wire_type, &mut out, "signature");
            }
            2 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "checksum");
            }
            3 => {
                let _ = insert_i64(bytes, &mut cursor, wire_type, &mut out, "timestamp_utc");
            }
            4 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "mime");
            }
            5 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    out.insert(
                        "external_identity".to_string(),
                        decode_external_identity(message),
                    );
                }
            }
            6 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "type");
            }
            7 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "title");
            }
            8 => {
                let _ = insert_f64(bytes, &mut cursor, wire_type, &mut out, "lat");
            }
            9 => {
                let _ = insert_f64(bytes, &mut cursor, wire_type, &mut out, "lng");
            }
            10 => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
            11 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "content");
            }
            12 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "merkle_root");
            }
            13 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "alg");
            }
            _ => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
        }
    }

    Value::Object(out)
}

fn decode_attachment_record(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();
    let mut custody_event: Option<String> = None;
    let mut custody_status: Option<String> = None;
    let mut custody_context_ref: Option<String> = None;

    while cursor < bytes.len() {
        let Some(key) = read_varint(bytes, &mut cursor) else {
            break;
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "version");
            }
            2 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "attachment_id");
            }
            3 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "parent_record_id");
            }
            4 => {
                let _ = insert_bytes(bytes, &mut cursor, wire_type, &mut out, "signature");
            }
            5 => {
                let _ = insert_bytes(bytes, &mut cursor, wire_type, &mut out, "parent_signature");
            }
            6 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "checksum");
            }
            7 => {
                let _ = insert_i64(bytes, &mut cursor, wire_type, &mut out, "timestamp_utc");
            }
            8 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "mime");
            }
            9 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "type");
            }
            10 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "title");
            }
            11 => {
                let _ = insert_f64(bytes, &mut cursor, wire_type, &mut out, "lat");
            }
            12 => {
                let _ = insert_f64(bytes, &mut cursor, wire_type, &mut out, "lng");
            }
            13 => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
            14 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "content");
            }
            15 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "merkle_root");
            }
            16 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "alg");
            }
            17 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    out.insert(
                        "external_identity".to_string(),
                        decode_external_identity(message),
                    );
                }
            }
            18 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "custody_id");
            }
            19 => {
                if let Some(raw) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    if let Ok(value) = String::from_utf8(raw.to_vec()) {
                        custody_event = Some(value);
                    }
                }
            }
            20 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "canonical_string");
            }
            21 => {
                if let Some(raw) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    if let Ok(value) = String::from_utf8(raw.to_vec()) {
                        custody_status = Some(value);
                    }
                }
            }
            22 => {
                if let Some(raw) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    if let Ok(value) = String::from_utf8(raw.to_vec()) {
                        custody_context_ref = Some(value);
                    }
                }
            }
            _ => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
        }
    }

    if out.get("type").and_then(Value::as_str) == Some("custody") {
        let mut payload = Map::new();
        if let Some(event) = custody_event {
            payload.insert("event".to_string(), Value::String(event));
        }
        if let Some(status) = custody_status {
            payload.insert("status".to_string(), Value::String(status));
        }
        if let Some(context_ref) = custody_context_ref {
            payload.insert("context_ref".to_string(), Value::String(context_ref));
        }
        out.insert("payload".to_string(), Value::Object(payload));
    }

    Value::Object(out)
}

fn decode_full_record_response(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let key = match read_varint(bytes, &mut cursor) {
            Some(k) => k,
            None => break,
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                let _ = insert_string(bytes, &mut cursor, wire_type, &mut out, "record_id");
            }
            2 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    out.insert("scan_full".to_string(), decode_scan_record(message));
                }
            }
            3 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    out.insert(
                        "environment_full".to_string(),
                        decode_environment_record(message),
                    );
                }
            }
            _ => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
        }
    }

    Value::Object(out)
}

fn decode_record_batches(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut batches = Vec::new();

    while cursor < bytes.len() {
        let key = match read_varint(bytes, &mut cursor) {
            Some(k) => k,
            None => break,
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    batches.push(decode_record_batch(message));
                }
            }
            _ => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
        }
    }

    json!({ "batches": batches })
}

fn decode_record_batch(bytes: &[u8]) -> Value {
    let mut cursor = 0usize;
    let mut out = Map::new();
    let mut environment_records = Vec::new();
    let mut scan_records = Vec::new();

    while cursor < bytes.len() {
        let key = match read_varint(bytes, &mut cursor) {
            Some(k) => k,
            None => break,
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                let _ = insert_bytes(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "attestation_dac_der",
                );
            }
            2 => {
                let _ = insert_bytes(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "attestation_manufacturer_der",
                );
            }
            3 => {
                let _ = insert_bytes(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "attestation_intermediate_der",
                );
            }
            4 => {
                let _ = insert_bytes(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "heartbeat_slac_der",
                );
            }
            5 => {
                let _ = insert_bytes(bytes, &mut cursor, wire_type, &mut out, "heartbeat_der");
            }
            6 => {
                let _ = insert_bytes(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "heartbeat_intermediate_der",
                );
            }
            7 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    if let Some(device) = decode_record_device_info(message) {
                        out.insert("device".to_string(), device);
                    }
                }
            }
            8 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    let record = decode_environment_record(message);
                    let is_signed_full_record = record
                        .get("signature")
                        .and_then(Value::as_str)
                        .filter(|value| !value.is_empty())
                        .is_some()
                        && record
                            .get("canonical_string")
                            .and_then(Value::as_str)
                            .filter(|value| !value.is_empty())
                            .is_some();
                    let is_embedded_min = decode_data_entry(message)
                        .and_then(|entry| {
                            entry
                                .get("type")
                                .and_then(Value::as_str)
                                .map(str::to_string)
                        })
                        .as_deref()
                        == Some("environment_min");

                    if is_signed_full_record {
                        environment_records.push(record);
                    } else if !is_embedded_min {
                        environment_records.push(record);
                    }
                }
            }
            9 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    let record = decode_scan_record(message);
                    let is_signed_full_record = record
                        .get("signature")
                        .and_then(Value::as_str)
                        .filter(|value| !value.is_empty())
                        .is_some()
                        && record
                            .get("canonical_string")
                            .and_then(Value::as_str)
                            .filter(|value| !value.is_empty())
                            .is_some();
                    let is_embedded_min = decode_data_entry(message)
                        .and_then(|entry| {
                            entry
                                .get("type")
                                .and_then(Value::as_str)
                                .map(str::to_string)
                        })
                        .as_deref()
                        == Some("scan_min");

                    if is_signed_full_record {
                        scan_records.push(record);
                    } else if !is_embedded_min {
                        scan_records.push(record);
                    }
                }
            }
            13 => {
                if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                    out.entry("attachment_records".to_string())
                        .or_insert_with(|| Value::Array(Vec::new()))
                        .as_array_mut()
                        .expect("attachment_records is array")
                        .push(decode_attachment_record(message));
                }
            }
            10 => {
                let _ = insert_string(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "attestation_root_fingerprint",
                );
            }
            11 => {
                let _ = insert_string(
                    bytes,
                    &mut cursor,
                    wire_type,
                    &mut out,
                    "heartbeat_root_fingerprint",
                );
            }
            _ => {
                let _ = skip_field(bytes, &mut cursor, wire_type);
            }
        }
    }

    out.insert(
        "environment_records".to_string(),
        Value::Array(environment_records),
    );
    out.insert("scan_records".to_string(), Value::Array(scan_records));
    Value::Object(out)
}

fn decode_fetch_telemetry_response(bytes: &[u8]) -> Vec<Value> {
    let mut cursor = 0usize;
    let mut rows = Vec::new();

    while cursor < bytes.len() {
        let Some(key) = read_varint(bytes, &mut cursor) else {
            break;
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        if field == 1 && wire_type == WIRE_LENGTH_DELIMITED {
            if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                rows.push(Value::Array(decode_telemetry_row(message)));
            }
        } else {
            let _ = skip_field(bytes, &mut cursor, wire_type);
        }
    }

    rows
}

fn decode_telemetry_row(bytes: &[u8]) -> Vec<Value> {
    let mut cursor = 0usize;
    let mut values = Vec::new();

    while cursor < bytes.len() {
        let Some(key) = read_varint(bytes, &mut cursor) else {
            break;
        };
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        if field == 1 && wire_type == WIRE_LENGTH_DELIMITED {
            if let Some(message) = read_length_delimited(bytes, &mut cursor, wire_type) {
                if let Some(val) = decode_telemetry_value(message) {
                    values.push(val);
                }
            }
        } else {
            let _ = skip_field(bytes, &mut cursor, wire_type);
        }
    }

    values
}

fn decode_telemetry_value(bytes: &[u8]) -> Option<Value> {
    let mut cursor = 0usize;

    while cursor < bytes.len() {
        let key = read_varint(bytes, &mut cursor)?;
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => {
                return Some(Value::Number(number_from_f64(read_f32_field(
                    bytes,
                    &mut cursor,
                    wire_type,
                )? as f64)))
            }
            2 => {
                return Some(Value::String(read_string_field(
                    bytes,
                    &mut cursor,
                    wire_type,
                )?))
            }
            3 => {
                return Some(Value::Number(Number::from(read_i64_field(
                    bytes,
                    &mut cursor,
                    wire_type,
                )?)))
            }
            4 => {
                return Some(Value::Bool(
                    read_varint_field(bytes, &mut cursor, wire_type)? != 0,
                ))
            }
            _ => skip_field(bytes, &mut cursor, wire_type)?,
        }
    }

    None
}

fn decode_heartbeat_init_response(bytes: &[u8]) -> Option<Map<String, Value>> {
    let mut cursor = 0usize;
    let mut out = Map::new();

    while cursor < bytes.len() {
        let key = read_varint(bytes, &mut cursor)?;
        let field = (key >> 3) as u32;
        let wire_type = (key & 0x07) as u8;

        match field {
            1 => insert_string(bytes, &mut cursor, wire_type, &mut out, "signature")?,
            2 => insert_string(bytes, &mut cursor, wire_type, &mut out, "csr")?,
            3 => insert_string(bytes, &mut cursor, wire_type, &mut out, "attestation")?,
            4 => insert_u64(bytes, &mut cursor, wire_type, &mut out, "counter")?,
            5 => insert_i64(bytes, &mut cursor, wire_type, &mut out, "last_sync_bucket")?,
            6 => insert_i64(bytes, &mut cursor, wire_type, &mut out, "latest_timestamp")?,
            7 => insert_i64(bytes, &mut cursor, wire_type, &mut out, "current_timestamp")?,
            8 => insert_string(
                bytes,
                &mut cursor,
                wire_type,
                &mut out,
                "last_intermediate_serial",
            )?,
            9 => insert_string(bytes, &mut cursor, wire_type, &mut out, "last_slac_serial")?,
            _ => skip_field(bytes, &mut cursor, wire_type)?,
        }
    }

    Some(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn decode_string_fields(bytes: &[u8]) -> Map<String, Value> {
        let mut cursor = 0usize;
        let mut out = Map::new();

        while cursor < bytes.len() {
            let key = read_varint(bytes, &mut cursor).expect("field key");
            let field = (key >> 3) as u32;
            let wire_type = (key & 0x07) as u8;
            assert_eq!(wire_type, WIRE_LENGTH_DELIMITED);

            let field_bytes =
                read_length_delimited(bytes, &mut cursor, wire_type).expect("field bytes");
            let field_value = String::from_utf8(field_bytes.to_vec()).expect("utf8 string");
            out.insert(field.to_string(), Value::String(field_value));
        }

        out
    }

    #[test]
    fn encode_attest_request_includes_custody_fields() {
        let encoded = encode_command_request(&json!({
            "action": "attest",
            "opts": {
                "parent_record_id": "SCAN-1",
                "type": "custody",
                "custody_id": "CUST-1",
                "event": "handoff",
                "status": "received",
                "context_ref": "shipment-123"
            }
        }))
        .expect("encoded attest request");

        let mut cursor = 0usize;
        let mut action = None;
        let mut attest_fields = Map::new();

        while cursor < encoded.len() {
            let key = read_varint(&encoded, &mut cursor).expect("top-level key");
            let field = (key >> 3) as u32;
            let wire_type = (key & 0x07) as u8;

            match field {
                1 => {
                    assert_eq!(wire_type, WIRE_LENGTH_DELIMITED);
                    let value = read_length_delimited(&encoded, &mut cursor, wire_type)
                        .expect("action bytes");
                    action = Some(String::from_utf8(value.to_vec()).expect("action utf8"));
                }
                4 => {
                    assert_eq!(wire_type, WIRE_LENGTH_DELIMITED);
                    let value = read_length_delimited(&encoded, &mut cursor, wire_type)
                        .expect("attest message");
                    attest_fields = decode_string_fields(value);
                }
                _ => skip_field(&encoded, &mut cursor, wire_type).expect("skip unknown field"),
            }
        }

        assert_eq!(action.as_deref(), Some("attest"));
        assert_eq!(
            attest_fields.get("1").and_then(Value::as_str),
            Some("SCAN-1")
        );
        assert_eq!(
            attest_fields.get("6").and_then(Value::as_str),
            Some("custody")
        );
        assert_eq!(
            attest_fields.get("12").and_then(Value::as_str),
            Some("CUST-1")
        );
        assert_eq!(
            attest_fields.get("13").and_then(Value::as_str),
            Some("handoff")
        );
        assert_eq!(
            attest_fields.get("14").and_then(Value::as_str),
            Some("received")
        );
        assert_eq!(
            attest_fields.get("15").and_then(Value::as_str),
            Some("shipment-123")
        );
    }

    #[test]
    fn decode_attachment_record_maps_custody_payload_fields() {
        let mut encoded = Vec::new();
        write_string(&mut encoded, 1, "1.0");
        write_string(&mut encoded, 3, "SCAN-1");
        write_bytes(&mut encoded, 4, b"SIG-1");
        write_bytes(&mut encoded, 5, b"PARENT-SIG");
        write_i64(&mut encoded, 7, 1770823650);
        write_string(&mut encoded, 9, "custody");
        write_string(&mut encoded, 18, "CUST-1");
        write_string(&mut encoded, 19, "handoff");
        write_string(&mut encoded, 20, "canon");
        write_string(&mut encoded, 21, "received");
        write_string(&mut encoded, 22, "shipment-123");

        let decoded = decode_attachment_record(&encoded);

        assert_eq!(decoded.get("type").and_then(Value::as_str), Some("custody"));
        assert_eq!(
            decoded.get("custody_id").and_then(Value::as_str),
            Some("CUST-1")
        );
        assert_eq!(
            decoded.get("parent_record_id").and_then(Value::as_str),
            Some("SCAN-1")
        );
        assert_eq!(
            decoded
                .get("payload")
                .and_then(|v| v.get("event"))
                .and_then(Value::as_str),
            Some("handoff")
        );
        assert_eq!(
            decoded
                .get("payload")
                .and_then(|v| v.get("status"))
                .and_then(Value::as_str),
            Some("received")
        );
        assert_eq!(
            decoded
                .get("payload")
                .and_then(|v| v.get("context_ref"))
                .and_then(Value::as_str),
            Some("shipment-123")
        );
    }

    #[test]
    fn decode_record_batch_maps_device_identity_root_fingerprints_and_record_types() {
        let mut encoded = Vec::new();

        let mut device = Vec::new();
        write_string(&mut device, 1, "LUK-REAL-1");
        write_bytes(&mut device, 2, b"PUBKEY");
        write_message(&mut encoded, 7, &device);

        write_string(&mut encoded, 10, "att-root-fp");
        write_string(&mut encoded, 11, "hb-root-fp");

        let mut environment = Vec::new();
        write_string(&mut environment, 1, "1.0");
        write_string(&mut environment, 2, "ENV-1");
        write_bytes(&mut environment, 3, b"SIG-1");
        write_bytes(&mut environment, 4, b"PREV-1");
        write_string(&mut environment, 5, "env-canonical");
        write_message(&mut encoded, 8, &environment);

        let mut scan = Vec::new();
        write_string(&mut scan, 1, "1.0");
        write_string(&mut scan, 2, "SCAN-1");
        write_bytes(&mut scan, 3, b"SIG-2");
        write_bytes(&mut scan, 4, b"PREV-2");
        write_string(&mut scan, 5, "scan-canonical");
        write_message(&mut encoded, 9, &scan);

        let decoded = decode_record_batch(&encoded);
        let device = decoded
            .get("device")
            .and_then(Value::as_object)
            .expect("decoded batch device");

        assert_eq!(
            device.get("device_id").and_then(Value::as_str),
            Some("LUK-REAL-1")
        );
        let expected_public_key = BASE64.encode(b"PUBKEY");
        assert_eq!(
            device.get("public_key").and_then(Value::as_str),
            Some(expected_public_key.as_str())
        );
        assert_eq!(
            decoded
                .get("attestation_root_fingerprint")
                .and_then(Value::as_str),
            Some("att-root-fp")
        );
        assert_eq!(
            decoded
                .get("heartbeat_root_fingerprint")
                .and_then(Value::as_str),
            Some("hb-root-fp")
        );
        assert_eq!(
            decoded
                .get("environment_records")
                .and_then(Value::as_array)
                .and_then(|records| records.first())
                .and_then(|record| record.get("type"))
                .and_then(Value::as_str),
            Some("environment")
        );
        assert_eq!(
            decoded
                .get("scan_records")
                .and_then(Value::as_array)
                .and_then(|records| records.first())
                .and_then(|record| record.get("type"))
                .and_then(Value::as_str),
            Some("scan")
        );
        assert_eq!(
            decoded
                .get("environment_records")
                .and_then(Value::as_array)
                .and_then(|records| records.first())
                .and_then(|record| record.get("canonical_string"))
                .and_then(Value::as_str),
            Some("env-canonical")
        );
        assert_eq!(
            decoded
                .get("scan_records")
                .and_then(Value::as_array)
                .and_then(|records| records.first())
                .and_then(|record| record.get("canonical_string"))
                .and_then(Value::as_str),
            Some("scan-canonical")
        );
    }

    #[test]
    fn decode_record_batch_skips_embedded_environment_min_entries() {
        let mut encoded = Vec::new();

        let mut environment_min = Vec::new();
        write_string(&mut environment_min, 1, "1.0");
        write_string(&mut environment_min, 2, "ENV-MIN-1");
        write_i64(&mut environment_min, 3, 1770823456);

        let mut data_entry = Vec::new();
        write_message(&mut data_entry, 2, &environment_min);
        write_message(&mut encoded, 8, &data_entry);

        let decoded = decode_record_batch(&encoded);
        assert_eq!(
            decoded
                .get("environment_records")
                .and_then(Value::as_array)
                .map(|records| records.len()),
            Some(0)
        );
    }

    #[test]
    fn decode_command_response_keeps_record_batches_out_of_data() {
        let mut batch = Vec::new();

        let mut environment = Vec::new();
        write_string(&mut environment, 1, "1.0");
        write_string(&mut environment, 2, "ENV-1");
        write_bytes(&mut environment, 3, b"SIG-1");
        write_bytes(&mut environment, 4, b"PREV-1");
        write_string(&mut environment, 5, "env-canonical");
        write_message(&mut batch, 8, &environment);

        let mut record_batches = Vec::new();
        write_message(&mut record_batches, 1, &batch);

        let mut response = Vec::new();
        write_string(&mut response, 1, "get");
        write_u32(&mut response, 2, 0);
        write_bool(&mut response, 3, true);
        write_message(&mut response, 15, &record_batches);

        let decoded = decode_command_response(&response).expect("decoded command response");

        assert!(decoded.get("data").is_none());
        assert_eq!(
            decoded
                .get("record_batches")
                .and_then(|value| value.get("batches"))
                .and_then(Value::as_array)
                .map(|batches| batches.len()),
            Some(1)
        );
        assert_eq!(
            decoded
                .get("record_batches")
                .and_then(|value| value.get("batches"))
                .and_then(Value::as_array)
                .and_then(|batches| batches.first())
                .and_then(|batch| batch.get("environment_records"))
                .and_then(Value::as_array)
                .and_then(|records| records.first())
                .and_then(|record| record.get("canonical_string"))
                .and_then(Value::as_str),
            Some("env-canonical")
        );
    }
}
