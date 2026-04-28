// SPDX-License-Identifier: Apache-2.0
import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace lukuid. */
export namespace lukuid {

    /** Status enum. */
    enum Status {
        STATUS_UNKNOWN = 0,
        STATUS_OK = 1,
        STATUS_ERROR = 2,
        STATUS_READY = 3
    }

    /** FetchWindow enum. */
    enum FetchWindow {
        FETCH_WINDOW_NONE = 0,
        FETCH_WINDOW_HOURLY = 1,
        FETCH_WINDOW_DAILY = 2,
        FETCH_WINDOW_WEEKLY = 3,
        FETCH_WINDOW_MONTHLY = 4
    }

    /** Properties of a MetricStats. */
    interface IMetricStats {

        /** MetricStats avg */
        avg?: (number|null);

        /** MetricStats min */
        min?: (number|null);

        /** MetricStats max */
        max?: (number|null);

        /** MetricStats variance */
        variance?: (number|null);

        /** MetricStats count */
        count?: (number|null);
    }

    /** Represents a MetricStats. */
    class MetricStats implements IMetricStats {

        /**
         * Constructs a new MetricStats.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IMetricStats);

        /** MetricStats avg. */
        public avg: number;

        /** MetricStats min. */
        public min: number;

        /** MetricStats max. */
        public max: number;

        /** MetricStats variance. */
        public variance: number;

        /** MetricStats count. */
        public count: number;

        /**
         * Creates a new MetricStats instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MetricStats instance
         */
        public static create(properties?: lukuid.IMetricStats): lukuid.MetricStats;

        /**
         * Encodes the specified MetricStats message. Does not implicitly {@link lukuid.MetricStats.verify|verify} messages.
         * @param message MetricStats message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IMetricStats, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MetricStats message, length delimited. Does not implicitly {@link lukuid.MetricStats.verify|verify} messages.
         * @param message MetricStats message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IMetricStats, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MetricStats message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MetricStats
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.MetricStats;

        /**
         * Decodes a MetricStats message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MetricStats
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.MetricStats;

        /**
         * Verifies a MetricStats message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MetricStats message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MetricStats
         */
        public static fromObject(object: { [k: string]: any }): lukuid.MetricStats;

        /**
         * Creates a plain object from a MetricStats message. Also converts values to other types if specified.
         * @param message MetricStats
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.MetricStats, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MetricStats to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MetricStats
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MetricValue. */
    interface IMetricValue {

        /** MetricValue value */
        value?: (number|null);

        /** MetricValue stats */
        stats?: (lukuid.IMetricStats|null);
    }

    /** Represents a MetricValue. */
    class MetricValue implements IMetricValue {

        /**
         * Constructs a new MetricValue.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IMetricValue);

        /** MetricValue value. */
        public value?: (number|null);

        /** MetricValue stats. */
        public stats?: (lukuid.IMetricStats|null);

        /** MetricValue kind. */
        public kind?: ("value"|"stats");

        /**
         * Creates a new MetricValue instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MetricValue instance
         */
        public static create(properties?: lukuid.IMetricValue): lukuid.MetricValue;

        /**
         * Encodes the specified MetricValue message. Does not implicitly {@link lukuid.MetricValue.verify|verify} messages.
         * @param message MetricValue message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IMetricValue, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MetricValue message, length delimited. Does not implicitly {@link lukuid.MetricValue.verify|verify} messages.
         * @param message MetricValue message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IMetricValue, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MetricValue message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MetricValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.MetricValue;

        /**
         * Decodes a MetricValue message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MetricValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.MetricValue;

        /**
         * Verifies a MetricValue message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MetricValue message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MetricValue
         */
        public static fromObject(object: { [k: string]: any }): lukuid.MetricValue;

        /**
         * Creates a plain object from a MetricValue message. Also converts values to other types if specified.
         * @param message MetricValue
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.MetricValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MetricValue to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MetricValue
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a FetchRequest. */
    interface IFetchRequest {

        /** FetchRequest query */
        query?: (string|null);

        /** FetchRequest offset */
        offset?: (number|null);

        /** FetchRequest limit */
        limit?: (number|null);

        /** FetchRequest fetchFull */
        fetchFull?: (boolean|null);

        /** FetchRequest starts */
        starts?: (number|Long|null);

        /** FetchRequest ends */
        ends?: (number|Long|null);

        /** FetchRequest window */
        window?: (lukuid.FetchWindow|null);
    }

    /** Represents a FetchRequest. */
    class FetchRequest implements IFetchRequest {

        /**
         * Constructs a new FetchRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IFetchRequest);

        /** FetchRequest query. */
        public query: string;

        /** FetchRequest offset. */
        public offset: number;

        /** FetchRequest limit. */
        public limit: number;

        /** FetchRequest fetchFull. */
        public fetchFull: boolean;

        /** FetchRequest starts. */
        public starts: (number|Long);

        /** FetchRequest ends. */
        public ends: (number|Long);

        /** FetchRequest window. */
        public window: lukuid.FetchWindow;

        /**
         * Creates a new FetchRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FetchRequest instance
         */
        public static create(properties?: lukuid.IFetchRequest): lukuid.FetchRequest;

        /**
         * Encodes the specified FetchRequest message. Does not implicitly {@link lukuid.FetchRequest.verify|verify} messages.
         * @param message FetchRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IFetchRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FetchRequest message, length delimited. Does not implicitly {@link lukuid.FetchRequest.verify|verify} messages.
         * @param message FetchRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IFetchRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FetchRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FetchRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.FetchRequest;

        /**
         * Decodes a FetchRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FetchRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.FetchRequest;

        /**
         * Verifies a FetchRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FetchRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FetchRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.FetchRequest;

        /**
         * Creates a plain object from a FetchRequest message. Also converts values to other types if specified.
         * @param message FetchRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.FetchRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FetchRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for FetchRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GetRecordRequest. */
    interface IGetRecordRequest {

        /** GetRecordRequest recordId */
        recordId?: (string|null);
    }

    /** Represents a GetRecordRequest. */
    class GetRecordRequest implements IGetRecordRequest {

        /**
         * Constructs a new GetRecordRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IGetRecordRequest);

        /** GetRecordRequest recordId. */
        public recordId: string;

        /**
         * Creates a new GetRecordRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetRecordRequest instance
         */
        public static create(properties?: lukuid.IGetRecordRequest): lukuid.GetRecordRequest;

        /**
         * Encodes the specified GetRecordRequest message. Does not implicitly {@link lukuid.GetRecordRequest.verify|verify} messages.
         * @param message GetRecordRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IGetRecordRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetRecordRequest message, length delimited. Does not implicitly {@link lukuid.GetRecordRequest.verify|verify} messages.
         * @param message GetRecordRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IGetRecordRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetRecordRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetRecordRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.GetRecordRequest;

        /**
         * Decodes a GetRecordRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetRecordRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.GetRecordRequest;

        /**
         * Verifies a GetRecordRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetRecordRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetRecordRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.GetRecordRequest;

        /**
         * Creates a plain object from a GetRecordRequest message. Also converts values to other types if specified.
         * @param message GetRecordRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.GetRecordRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetRecordRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GetRecordRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an AttestRequest. */
    interface IAttestRequest {

        /** AttestRequest parentRecordId */
        parentRecordId?: (string|null);

        /** AttestRequest signature */
        signature?: (Uint8Array|null);

        /** AttestRequest checksum */
        checksum?: (string|null);

        /** AttestRequest mime */
        mime?: (string|null);

        /** AttestRequest type */
        type?: (string|null);

        /** AttestRequest title */
        title?: (string|null);

        /** AttestRequest lat */
        lat?: (number|null);

        /** AttestRequest lng */
        lng?: (number|null);

        /** AttestRequest content */
        content?: (string|null);

        /** AttestRequest merkleRoot */
        merkleRoot?: (string|null);

        /** AttestRequest custodyId */
        custodyId?: (string|null);

        /** AttestRequest event */
        event?: (string|null);

        /** AttestRequest status */
        status?: (string|null);

        /** AttestRequest contextRef */
        contextRef?: (string|null);
    }

    /** Represents an AttestRequest. */
    class AttestRequest implements IAttestRequest {

        /**
         * Constructs a new AttestRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IAttestRequest);

        /** AttestRequest parentRecordId. */
        public parentRecordId: string;

        /** AttestRequest signature. */
        public signature: Uint8Array;

        /** AttestRequest checksum. */
        public checksum: string;

        /** AttestRequest mime. */
        public mime: string;

        /** AttestRequest type. */
        public type: string;

        /** AttestRequest title. */
        public title: string;

        /** AttestRequest lat. */
        public lat: number;

        /** AttestRequest lng. */
        public lng: number;

        /** AttestRequest content. */
        public content: string;

        /** AttestRequest merkleRoot. */
        public merkleRoot: string;

        /** AttestRequest custodyId. */
        public custodyId: string;

        /** AttestRequest event. */
        public event: string;

        /** AttestRequest status. */
        public status: string;

        /** AttestRequest contextRef. */
        public contextRef: string;

        /**
         * Creates a new AttestRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AttestRequest instance
         */
        public static create(properties?: lukuid.IAttestRequest): lukuid.AttestRequest;

        /**
         * Encodes the specified AttestRequest message. Does not implicitly {@link lukuid.AttestRequest.verify|verify} messages.
         * @param message AttestRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IAttestRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AttestRequest message, length delimited. Does not implicitly {@link lukuid.AttestRequest.verify|verify} messages.
         * @param message AttestRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IAttestRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AttestRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AttestRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.AttestRequest;

        /**
         * Decodes an AttestRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AttestRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.AttestRequest;

        /**
         * Verifies an AttestRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AttestRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AttestRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.AttestRequest;

        /**
         * Creates a plain object from an AttestRequest message. Also converts values to other types if specified.
         * @param message AttestRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.AttestRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AttestRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for AttestRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ConfigRequest. */
    interface IConfigRequest {

        /** ConfigRequest name */
        name?: (string|null);

        /** ConfigRequest wifiSsid */
        wifiSsid?: (string|null);

        /** ConfigRequest wifiPassword */
        wifiPassword?: (string|null);

        /** ConfigRequest mqttBrokerUrl */
        mqttBrokerUrl?: (string|null);

        /** ConfigRequest mqttPort */
        mqttPort?: (number|null);

        /** ConfigRequest mqttTopic */
        mqttTopic?: (string|null);

        /** ConfigRequest mqttBroadcastFrequencySeconds */
        mqttBroadcastFrequencySeconds?: (number|null);

        /** ConfigRequest mqttUsername */
        mqttUsername?: (string|null);

        /** ConfigRequest mqttPassword */
        mqttPassword?: (string|null);

        /** ConfigRequest mqttCertificateDer */
        mqttCertificateDer?: (Uint8Array|null);

        /** ConfigRequest mqttCaDer */
        mqttCaDer?: (Uint8Array|null);

        /** ConfigRequest mqttBroadcastEnabled */
        mqttBroadcastEnabled?: (boolean|null);

        /** ConfigRequest customHeartbeatUrl */
        customHeartbeatUrl?: (string|null);

        /** ConfigRequest telemetryEnabled */
        telemetryEnabled?: (boolean|null);
    }

    /** Represents a ConfigRequest. */
    class ConfigRequest implements IConfigRequest {

        /**
         * Constructs a new ConfigRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IConfigRequest);

        /** ConfigRequest name. */
        public name?: (string|null);

        /** ConfigRequest wifiSsid. */
        public wifiSsid?: (string|null);

        /** ConfigRequest wifiPassword. */
        public wifiPassword?: (string|null);

        /** ConfigRequest mqttBrokerUrl. */
        public mqttBrokerUrl?: (string|null);

        /** ConfigRequest mqttPort. */
        public mqttPort?: (number|null);

        /** ConfigRequest mqttTopic. */
        public mqttTopic?: (string|null);

        /** ConfigRequest mqttBroadcastFrequencySeconds. */
        public mqttBroadcastFrequencySeconds?: (number|null);

        /** ConfigRequest mqttUsername. */
        public mqttUsername?: (string|null);

        /** ConfigRequest mqttPassword. */
        public mqttPassword?: (string|null);

        /** ConfigRequest mqttCertificateDer. */
        public mqttCertificateDer?: (Uint8Array|null);

        /** ConfigRequest mqttCaDer. */
        public mqttCaDer?: (Uint8Array|null);

        /** ConfigRequest mqttBroadcastEnabled. */
        public mqttBroadcastEnabled?: (boolean|null);

        /** ConfigRequest customHeartbeatUrl. */
        public customHeartbeatUrl?: (string|null);

        /** ConfigRequest telemetryEnabled. */
        public telemetryEnabled?: (boolean|null);

        /**
         * Creates a new ConfigRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ConfigRequest instance
         */
        public static create(properties?: lukuid.IConfigRequest): lukuid.ConfigRequest;

        /**
         * Encodes the specified ConfigRequest message. Does not implicitly {@link lukuid.ConfigRequest.verify|verify} messages.
         * @param message ConfigRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IConfigRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ConfigRequest message, length delimited. Does not implicitly {@link lukuid.ConfigRequest.verify|verify} messages.
         * @param message ConfigRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IConfigRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ConfigRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ConfigRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.ConfigRequest;

        /**
         * Decodes a ConfigRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ConfigRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.ConfigRequest;

        /**
         * Verifies a ConfigRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ConfigRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ConfigRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.ConfigRequest;

        /**
         * Creates a plain object from a ConfigRequest message. Also converts values to other types if specified.
         * @param message ConfigRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.ConfigRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ConfigRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ConfigRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an OtaBeginRequest. */
    interface IOtaBeginRequest {

        /** OtaBeginRequest size */
        size?: (number|null);

        /** OtaBeginRequest publicKey */
        publicKey?: (Uint8Array|null);

        /** OtaBeginRequest binaryMode */
        binaryMode?: (boolean|null);
    }

    /** Represents an OtaBeginRequest. */
    class OtaBeginRequest implements IOtaBeginRequest {

        /**
         * Constructs a new OtaBeginRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IOtaBeginRequest);

        /** OtaBeginRequest size. */
        public size: number;

        /** OtaBeginRequest publicKey. */
        public publicKey: Uint8Array;

        /** OtaBeginRequest binaryMode. */
        public binaryMode: boolean;

        /**
         * Creates a new OtaBeginRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OtaBeginRequest instance
         */
        public static create(properties?: lukuid.IOtaBeginRequest): lukuid.OtaBeginRequest;

        /**
         * Encodes the specified OtaBeginRequest message. Does not implicitly {@link lukuid.OtaBeginRequest.verify|verify} messages.
         * @param message OtaBeginRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IOtaBeginRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OtaBeginRequest message, length delimited. Does not implicitly {@link lukuid.OtaBeginRequest.verify|verify} messages.
         * @param message OtaBeginRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IOtaBeginRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OtaBeginRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OtaBeginRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.OtaBeginRequest;

        /**
         * Decodes an OtaBeginRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OtaBeginRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.OtaBeginRequest;

        /**
         * Verifies an OtaBeginRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OtaBeginRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OtaBeginRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.OtaBeginRequest;

        /**
         * Creates a plain object from an OtaBeginRequest message. Also converts values to other types if specified.
         * @param message OtaBeginRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.OtaBeginRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OtaBeginRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for OtaBeginRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an OtaDataRequest. */
    interface IOtaDataRequest {

        /** OtaDataRequest data */
        data?: (Uint8Array|null);

        /** OtaDataRequest offset */
        offset?: (number|null);
    }

    /** Represents an OtaDataRequest. */
    class OtaDataRequest implements IOtaDataRequest {

        /**
         * Constructs a new OtaDataRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IOtaDataRequest);

        /** OtaDataRequest data. */
        public data: Uint8Array;

        /** OtaDataRequest offset. */
        public offset: number;

        /**
         * Creates a new OtaDataRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OtaDataRequest instance
         */
        public static create(properties?: lukuid.IOtaDataRequest): lukuid.OtaDataRequest;

        /**
         * Encodes the specified OtaDataRequest message. Does not implicitly {@link lukuid.OtaDataRequest.verify|verify} messages.
         * @param message OtaDataRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IOtaDataRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OtaDataRequest message, length delimited. Does not implicitly {@link lukuid.OtaDataRequest.verify|verify} messages.
         * @param message OtaDataRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IOtaDataRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OtaDataRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OtaDataRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.OtaDataRequest;

        /**
         * Decodes an OtaDataRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OtaDataRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.OtaDataRequest;

        /**
         * Verifies an OtaDataRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OtaDataRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OtaDataRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.OtaDataRequest;

        /**
         * Creates a plain object from an OtaDataRequest message. Also converts values to other types if specified.
         * @param message OtaDataRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.OtaDataRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OtaDataRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for OtaDataRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an OtaEndRequest. */
    interface IOtaEndRequest {

        /** OtaEndRequest signature */
        signature?: (Uint8Array|null);
    }

    /** Represents an OtaEndRequest. */
    class OtaEndRequest implements IOtaEndRequest {

        /**
         * Constructs a new OtaEndRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IOtaEndRequest);

        /** OtaEndRequest signature. */
        public signature: Uint8Array;

        /**
         * Creates a new OtaEndRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OtaEndRequest instance
         */
        public static create(properties?: lukuid.IOtaEndRequest): lukuid.OtaEndRequest;

        /**
         * Encodes the specified OtaEndRequest message. Does not implicitly {@link lukuid.OtaEndRequest.verify|verify} messages.
         * @param message OtaEndRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IOtaEndRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OtaEndRequest message, length delimited. Does not implicitly {@link lukuid.OtaEndRequest.verify|verify} messages.
         * @param message OtaEndRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IOtaEndRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OtaEndRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OtaEndRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.OtaEndRequest;

        /**
         * Decodes an OtaEndRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OtaEndRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.OtaEndRequest;

        /**
         * Verifies an OtaEndRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OtaEndRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OtaEndRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.OtaEndRequest;

        /**
         * Creates a plain object from an OtaEndRequest message. Also converts values to other types if specified.
         * @param message OtaEndRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.OtaEndRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OtaEndRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for OtaEndRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a SetAttestationRequest. */
    interface ISetAttestationRequest {

        /** SetAttestationRequest dacDer */
        dacDer?: (Uint8Array|null);

        /** SetAttestationRequest manufacturerDer */
        manufacturerDer?: (Uint8Array|null);

        /** SetAttestationRequest signature */
        signature?: (Uint8Array|null);

        /** SetAttestationRequest counter */
        counter?: (number|Long|null);

        /** SetAttestationRequest nonce */
        nonce?: (string|null);

        /** SetAttestationRequest intermediateDer */
        intermediateDer?: (Uint8Array|null);
    }

    /** Represents a SetAttestationRequest. */
    class SetAttestationRequest implements ISetAttestationRequest {

        /**
         * Constructs a new SetAttestationRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.ISetAttestationRequest);

        /** SetAttestationRequest dacDer. */
        public dacDer: Uint8Array;

        /** SetAttestationRequest manufacturerDer. */
        public manufacturerDer: Uint8Array;

        /** SetAttestationRequest signature. */
        public signature: Uint8Array;

        /** SetAttestationRequest counter. */
        public counter: (number|Long);

        /** SetAttestationRequest nonce. */
        public nonce: string;

        /** SetAttestationRequest intermediateDer. */
        public intermediateDer: Uint8Array;

        /**
         * Creates a new SetAttestationRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SetAttestationRequest instance
         */
        public static create(properties?: lukuid.ISetAttestationRequest): lukuid.SetAttestationRequest;

        /**
         * Encodes the specified SetAttestationRequest message. Does not implicitly {@link lukuid.SetAttestationRequest.verify|verify} messages.
         * @param message SetAttestationRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.ISetAttestationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SetAttestationRequest message, length delimited. Does not implicitly {@link lukuid.SetAttestationRequest.verify|verify} messages.
         * @param message SetAttestationRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.ISetAttestationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SetAttestationRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SetAttestationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.SetAttestationRequest;

        /**
         * Decodes a SetAttestationRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SetAttestationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.SetAttestationRequest;

        /**
         * Verifies a SetAttestationRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SetAttestationRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SetAttestationRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.SetAttestationRequest;

        /**
         * Creates a plain object from a SetAttestationRequest message. Also converts values to other types if specified.
         * @param message SetAttestationRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.SetAttestationRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SetAttestationRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SetAttestationRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a SetHeartbeatRequest. */
    interface ISetHeartbeatRequest {

        /** SetHeartbeatRequest slacDer */
        slacDer?: (Uint8Array|null);

        /** SetHeartbeatRequest heartbeatDer */
        heartbeatDer?: (Uint8Array|null);

        /** SetHeartbeatRequest signature */
        signature?: (Uint8Array|null);

        /** SetHeartbeatRequest timestamp */
        timestamp?: (number|Long|null);

        /** SetHeartbeatRequest intermediateDer */
        intermediateDer?: (Uint8Array|null);
    }

    /** Represents a SetHeartbeatRequest. */
    class SetHeartbeatRequest implements ISetHeartbeatRequest {

        /**
         * Constructs a new SetHeartbeatRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.ISetHeartbeatRequest);

        /** SetHeartbeatRequest slacDer. */
        public slacDer: Uint8Array;

        /** SetHeartbeatRequest heartbeatDer. */
        public heartbeatDer: Uint8Array;

        /** SetHeartbeatRequest signature. */
        public signature: Uint8Array;

        /** SetHeartbeatRequest timestamp. */
        public timestamp: (number|Long);

        /** SetHeartbeatRequest intermediateDer. */
        public intermediateDer: Uint8Array;

        /**
         * Creates a new SetHeartbeatRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SetHeartbeatRequest instance
         */
        public static create(properties?: lukuid.ISetHeartbeatRequest): lukuid.SetHeartbeatRequest;

        /**
         * Encodes the specified SetHeartbeatRequest message. Does not implicitly {@link lukuid.SetHeartbeatRequest.verify|verify} messages.
         * @param message SetHeartbeatRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.ISetHeartbeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SetHeartbeatRequest message, length delimited. Does not implicitly {@link lukuid.SetHeartbeatRequest.verify|verify} messages.
         * @param message SetHeartbeatRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.ISetHeartbeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SetHeartbeatRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SetHeartbeatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.SetHeartbeatRequest;

        /**
         * Decodes a SetHeartbeatRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SetHeartbeatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.SetHeartbeatRequest;

        /**
         * Verifies a SetHeartbeatRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SetHeartbeatRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SetHeartbeatRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.SetHeartbeatRequest;

        /**
         * Creates a plain object from a SetHeartbeatRequest message. Also converts values to other types if specified.
         * @param message SetHeartbeatRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.SetHeartbeatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SetHeartbeatRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SetHeartbeatRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ScanEnableRequest. */
    interface IScanEnableRequest {

        /** ScanEnableRequest enabled */
        enabled?: (boolean|null);
    }

    /** Represents a ScanEnableRequest. */
    class ScanEnableRequest implements IScanEnableRequest {

        /**
         * Constructs a new ScanEnableRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IScanEnableRequest);

        /** ScanEnableRequest enabled. */
        public enabled: boolean;

        /**
         * Creates a new ScanEnableRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ScanEnableRequest instance
         */
        public static create(properties?: lukuid.IScanEnableRequest): lukuid.ScanEnableRequest;

        /**
         * Encodes the specified ScanEnableRequest message. Does not implicitly {@link lukuid.ScanEnableRequest.verify|verify} messages.
         * @param message ScanEnableRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IScanEnableRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ScanEnableRequest message, length delimited. Does not implicitly {@link lukuid.ScanEnableRequest.verify|verify} messages.
         * @param message ScanEnableRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IScanEnableRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ScanEnableRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ScanEnableRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.ScanEnableRequest;

        /**
         * Decodes a ScanEnableRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ScanEnableRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.ScanEnableRequest;

        /**
         * Verifies a ScanEnableRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ScanEnableRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ScanEnableRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.ScanEnableRequest;

        /**
         * Creates a plain object from a ScanEnableRequest message. Also converts values to other types if specified.
         * @param message ScanEnableRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.ScanEnableRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ScanEnableRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ScanEnableRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GenerateHeartbeatRequest. */
    interface IGenerateHeartbeatRequest {
    }

    /** Represents a GenerateHeartbeatRequest. */
    class GenerateHeartbeatRequest implements IGenerateHeartbeatRequest {

        /**
         * Constructs a new GenerateHeartbeatRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IGenerateHeartbeatRequest);

        /**
         * Creates a new GenerateHeartbeatRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GenerateHeartbeatRequest instance
         */
        public static create(properties?: lukuid.IGenerateHeartbeatRequest): lukuid.GenerateHeartbeatRequest;

        /**
         * Encodes the specified GenerateHeartbeatRequest message. Does not implicitly {@link lukuid.GenerateHeartbeatRequest.verify|verify} messages.
         * @param message GenerateHeartbeatRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IGenerateHeartbeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GenerateHeartbeatRequest message, length delimited. Does not implicitly {@link lukuid.GenerateHeartbeatRequest.verify|verify} messages.
         * @param message GenerateHeartbeatRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IGenerateHeartbeatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GenerateHeartbeatRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GenerateHeartbeatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.GenerateHeartbeatRequest;

        /**
         * Decodes a GenerateHeartbeatRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GenerateHeartbeatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.GenerateHeartbeatRequest;

        /**
         * Verifies a GenerateHeartbeatRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GenerateHeartbeatRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GenerateHeartbeatRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.GenerateHeartbeatRequest;

        /**
         * Creates a plain object from a GenerateHeartbeatRequest message. Also converts values to other types if specified.
         * @param message GenerateHeartbeatRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.GenerateHeartbeatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GenerateHeartbeatRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GenerateHeartbeatRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a FetchTelemetryRequest. */
    interface IFetchTelemetryRequest {
    }

    /** Represents a FetchTelemetryRequest. */
    class FetchTelemetryRequest implements IFetchTelemetryRequest {

        /**
         * Constructs a new FetchTelemetryRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IFetchTelemetryRequest);

        /**
         * Creates a new FetchTelemetryRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FetchTelemetryRequest instance
         */
        public static create(properties?: lukuid.IFetchTelemetryRequest): lukuid.FetchTelemetryRequest;

        /**
         * Encodes the specified FetchTelemetryRequest message. Does not implicitly {@link lukuid.FetchTelemetryRequest.verify|verify} messages.
         * @param message FetchTelemetryRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IFetchTelemetryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FetchTelemetryRequest message, length delimited. Does not implicitly {@link lukuid.FetchTelemetryRequest.verify|verify} messages.
         * @param message FetchTelemetryRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IFetchTelemetryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FetchTelemetryRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FetchTelemetryRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.FetchTelemetryRequest;

        /**
         * Decodes a FetchTelemetryRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FetchTelemetryRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.FetchTelemetryRequest;

        /**
         * Verifies a FetchTelemetryRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FetchTelemetryRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FetchTelemetryRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.FetchTelemetryRequest;

        /**
         * Creates a plain object from a FetchTelemetryRequest message. Also converts values to other types if specified.
         * @param message FetchTelemetryRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.FetchTelemetryRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FetchTelemetryRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for FetchTelemetryRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a TelemetryValue. */
    interface ITelemetryValue {

        /** TelemetryValue fval */
        fval?: (number|null);

        /** TelemetryValue sval */
        sval?: (string|null);

        /** TelemetryValue ival */
        ival?: (number|Long|null);

        /** TelemetryValue bval */
        bval?: (boolean|null);
    }

    /** Represents a TelemetryValue. */
    class TelemetryValue implements ITelemetryValue {

        /**
         * Constructs a new TelemetryValue.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.ITelemetryValue);

        /** TelemetryValue fval. */
        public fval?: (number|null);

        /** TelemetryValue sval. */
        public sval?: (string|null);

        /** TelemetryValue ival. */
        public ival?: (number|Long|null);

        /** TelemetryValue bval. */
        public bval?: (boolean|null);

        /** TelemetryValue kind. */
        public kind?: ("fval"|"sval"|"ival"|"bval");

        /**
         * Creates a new TelemetryValue instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TelemetryValue instance
         */
        public static create(properties?: lukuid.ITelemetryValue): lukuid.TelemetryValue;

        /**
         * Encodes the specified TelemetryValue message. Does not implicitly {@link lukuid.TelemetryValue.verify|verify} messages.
         * @param message TelemetryValue message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.ITelemetryValue, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TelemetryValue message, length delimited. Does not implicitly {@link lukuid.TelemetryValue.verify|verify} messages.
         * @param message TelemetryValue message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.ITelemetryValue, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TelemetryValue message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TelemetryValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.TelemetryValue;

        /**
         * Decodes a TelemetryValue message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TelemetryValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.TelemetryValue;

        /**
         * Verifies a TelemetryValue message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TelemetryValue message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TelemetryValue
         */
        public static fromObject(object: { [k: string]: any }): lukuid.TelemetryValue;

        /**
         * Creates a plain object from a TelemetryValue message. Also converts values to other types if specified.
         * @param message TelemetryValue
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.TelemetryValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TelemetryValue to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for TelemetryValue
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a TelemetryRow. */
    interface ITelemetryRow {

        /** TelemetryRow values */
        values?: (lukuid.ITelemetryValue[]|null);
    }

    /** Represents a TelemetryRow. */
    class TelemetryRow implements ITelemetryRow {

        /**
         * Constructs a new TelemetryRow.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.ITelemetryRow);

        /** TelemetryRow values. */
        public values: lukuid.ITelemetryValue[];

        /**
         * Creates a new TelemetryRow instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TelemetryRow instance
         */
        public static create(properties?: lukuid.ITelemetryRow): lukuid.TelemetryRow;

        /**
         * Encodes the specified TelemetryRow message. Does not implicitly {@link lukuid.TelemetryRow.verify|verify} messages.
         * @param message TelemetryRow message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.ITelemetryRow, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TelemetryRow message, length delimited. Does not implicitly {@link lukuid.TelemetryRow.verify|verify} messages.
         * @param message TelemetryRow message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.ITelemetryRow, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TelemetryRow message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TelemetryRow
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.TelemetryRow;

        /**
         * Decodes a TelemetryRow message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TelemetryRow
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.TelemetryRow;

        /**
         * Verifies a TelemetryRow message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TelemetryRow message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TelemetryRow
         */
        public static fromObject(object: { [k: string]: any }): lukuid.TelemetryRow;

        /**
         * Creates a plain object from a TelemetryRow message. Also converts values to other types if specified.
         * @param message TelemetryRow
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.TelemetryRow, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TelemetryRow to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for TelemetryRow
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a FetchTelemetryResponse. */
    interface IFetchTelemetryResponse {

        /** FetchTelemetryResponse rows */
        rows?: (lukuid.ITelemetryRow[]|null);

        /** FetchTelemetryResponse signature */
        signature?: (Uint8Array|null);

        /** FetchTelemetryResponse canonicalString */
        canonicalString?: (string|null);
    }

    /** Represents a FetchTelemetryResponse. */
    class FetchTelemetryResponse implements IFetchTelemetryResponse {

        /**
         * Constructs a new FetchTelemetryResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IFetchTelemetryResponse);

        /** FetchTelemetryResponse rows. */
        public rows: lukuid.ITelemetryRow[];

        /** FetchTelemetryResponse signature. */
        public signature?: (Uint8Array|null);

        /** FetchTelemetryResponse canonicalString. */
        public canonicalString?: (string|null);

        /**
         * Creates a new FetchTelemetryResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FetchTelemetryResponse instance
         */
        public static create(properties?: lukuid.IFetchTelemetryResponse): lukuid.FetchTelemetryResponse;

        /**
         * Encodes the specified FetchTelemetryResponse message. Does not implicitly {@link lukuid.FetchTelemetryResponse.verify|verify} messages.
         * @param message FetchTelemetryResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IFetchTelemetryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FetchTelemetryResponse message, length delimited. Does not implicitly {@link lukuid.FetchTelemetryResponse.verify|verify} messages.
         * @param message FetchTelemetryResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IFetchTelemetryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FetchTelemetryResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FetchTelemetryResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.FetchTelemetryResponse;

        /**
         * Decodes a FetchTelemetryResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FetchTelemetryResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.FetchTelemetryResponse;

        /**
         * Verifies a FetchTelemetryResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FetchTelemetryResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FetchTelemetryResponse
         */
        public static fromObject(object: { [k: string]: any }): lukuid.FetchTelemetryResponse;

        /**
         * Creates a plain object from a FetchTelemetryResponse message. Also converts values to other types if specified.
         * @param message FetchTelemetryResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.FetchTelemetryResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FetchTelemetryResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for FetchTelemetryResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a CommandRequest. */
    interface ICommandRequest {

        /** CommandRequest action */
        action?: (string|null);

        /** CommandRequest fetch */
        fetch?: (lukuid.IFetchRequest|null);

        /** CommandRequest get */
        get?: (lukuid.IGetRecordRequest|null);

        /** CommandRequest attest */
        attest?: (lukuid.IAttestRequest|null);

        /** CommandRequest config */
        config?: (lukuid.IConfigRequest|null);

        /** CommandRequest otaBegin */
        otaBegin?: (lukuid.IOtaBeginRequest|null);

        /** CommandRequest otaData */
        otaData?: (lukuid.IOtaDataRequest|null);

        /** CommandRequest otaDataV2 */
        otaDataV2?: (lukuid.IOtaEndRequest|null);

        /** CommandRequest setAttestation */
        setAttestation?: (lukuid.ISetAttestationRequest|null);

        /** CommandRequest setHeartbeat */
        setHeartbeat?: (lukuid.ISetHeartbeatRequest|null);

        /** CommandRequest scanEnable */
        scanEnable?: (lukuid.IScanEnableRequest|null);

        /** CommandRequest generateHeartbeat */
        generateHeartbeat?: (lukuid.IGenerateHeartbeatRequest|null);

        /** CommandRequest fetchTelemetry */
        fetchTelemetry?: (lukuid.IFetchTelemetryRequest|null);
    }

    /** Represents a CommandRequest. */
    class CommandRequest implements ICommandRequest {

        /**
         * Constructs a new CommandRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.ICommandRequest);

        /** CommandRequest action. */
        public action: string;

        /** CommandRequest fetch. */
        public fetch?: (lukuid.IFetchRequest|null);

        /** CommandRequest get. */
        public get?: (lukuid.IGetRecordRequest|null);

        /** CommandRequest attest. */
        public attest?: (lukuid.IAttestRequest|null);

        /** CommandRequest config. */
        public config?: (lukuid.IConfigRequest|null);

        /** CommandRequest otaBegin. */
        public otaBegin?: (lukuid.IOtaBeginRequest|null);

        /** CommandRequest otaData. */
        public otaData?: (lukuid.IOtaDataRequest|null);

        /** CommandRequest otaDataV2. */
        public otaDataV2?: (lukuid.IOtaEndRequest|null);

        /** CommandRequest setAttestation. */
        public setAttestation?: (lukuid.ISetAttestationRequest|null);

        /** CommandRequest setHeartbeat. */
        public setHeartbeat?: (lukuid.ISetHeartbeatRequest|null);

        /** CommandRequest scanEnable. */
        public scanEnable?: (lukuid.IScanEnableRequest|null);

        /** CommandRequest generateHeartbeat. */
        public generateHeartbeat?: (lukuid.IGenerateHeartbeatRequest|null);

        /** CommandRequest fetchTelemetry. */
        public fetchTelemetry?: (lukuid.IFetchTelemetryRequest|null);

        /** CommandRequest payload. */
        public payload?: ("fetch"|"get"|"attest"|"config"|"otaBegin"|"otaData"|"otaDataV2"|"setAttestation"|"setHeartbeat"|"scanEnable"|"generateHeartbeat"|"fetchTelemetry");

        /**
         * Creates a new CommandRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns CommandRequest instance
         */
        public static create(properties?: lukuid.ICommandRequest): lukuid.CommandRequest;

        /**
         * Encodes the specified CommandRequest message. Does not implicitly {@link lukuid.CommandRequest.verify|verify} messages.
         * @param message CommandRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.ICommandRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified CommandRequest message, length delimited. Does not implicitly {@link lukuid.CommandRequest.verify|verify} messages.
         * @param message CommandRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.ICommandRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a CommandRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns CommandRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.CommandRequest;

        /**
         * Decodes a CommandRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns CommandRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.CommandRequest;

        /**
         * Verifies a CommandRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a CommandRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns CommandRequest
         */
        public static fromObject(object: { [k: string]: any }): lukuid.CommandRequest;

        /**
         * Creates a plain object from a CommandRequest message. Also converts values to other types if specified.
         * @param message CommandRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.CommandRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this CommandRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for CommandRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a DeviceInfoResponse. */
    interface IDeviceInfoResponse {

        /** DeviceInfoResponse handshake */
        handshake?: (string|null);

        /** DeviceInfoResponse uptimeMs */
        uptimeMs?: (number|Long|null);

        /** DeviceInfoResponse token */
        token?: (Uint8Array|null);

        /** DeviceInfoResponse battery */
        battery?: (number|null);

        /** DeviceInfoResponse voltage */
        voltage?: (number|null);

        /** DeviceInfoResponse vbus */
        vbus?: (boolean|null);

        /** DeviceInfoResponse counter */
        counter?: (number|null);

        /** DeviceInfoResponse syncRequired */
        syncRequired?: (boolean|null);

        /** DeviceInfoResponse name */
        name?: (string|null);

        /** DeviceInfoResponse id */
        id?: (string|null);

        /** DeviceInfoResponse product */
        product?: (string|null);

        /** DeviceInfoResponse model */
        model?: (string|null);

        /** DeviceInfoResponse firmware */
        firmware?: (string|null);

        /** DeviceInfoResponse revision */
        revision?: (string|null);

        /** DeviceInfoResponse pairing */
        pairing?: (boolean|null);

        /** DeviceInfoResponse customHeartbeatUrl */
        customHeartbeatUrl?: (string|null);

        /** DeviceInfoResponse telemetry */
        telemetry?: (boolean|null);

        /** DeviceInfoResponse managedBy */
        managedBy?: (string|null);

        /** DeviceInfoResponse attestationDacDer */
        attestationDacDer?: (Uint8Array|null);

        /** DeviceInfoResponse attestationManufacturerDer */
        attestationManufacturerDer?: (Uint8Array|null);

        /** DeviceInfoResponse attestationIntermediateDer */
        attestationIntermediateDer?: (Uint8Array|null);

        /** DeviceInfoResponse attestationRootFingerprint */
        attestationRootFingerprint?: (string|null);

        /** DeviceInfoResponse heartbeatSlacDer */
        heartbeatSlacDer?: (Uint8Array|null);

        /** DeviceInfoResponse heartbeatDer */
        heartbeatDer?: (Uint8Array|null);

        /** DeviceInfoResponse heartbeatIntermediateDer */
        heartbeatIntermediateDer?: (Uint8Array|null);

        /** DeviceInfoResponse heartbeatRootFingerprint */
        heartbeatRootFingerprint?: (string|null);

        /** DeviceInfoResponse signature */
        signature?: (Uint8Array|null);

        /** DeviceInfoResponse key */
        key?: (Uint8Array|null);
    }

    /** Represents a DeviceInfoResponse. */
    class DeviceInfoResponse implements IDeviceInfoResponse {

        /**
         * Constructs a new DeviceInfoResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IDeviceInfoResponse);

        /** DeviceInfoResponse handshake. */
        public handshake: string;

        /** DeviceInfoResponse uptimeMs. */
        public uptimeMs: (number|Long);

        /** DeviceInfoResponse token. */
        public token: Uint8Array;

        /** DeviceInfoResponse battery. */
        public battery: number;

        /** DeviceInfoResponse voltage. */
        public voltage: number;

        /** DeviceInfoResponse vbus. */
        public vbus: boolean;

        /** DeviceInfoResponse counter. */
        public counter: number;

        /** DeviceInfoResponse syncRequired. */
        public syncRequired: boolean;

        /** DeviceInfoResponse name. */
        public name: string;

        /** DeviceInfoResponse id. */
        public id: string;

        /** DeviceInfoResponse product. */
        public product: string;

        /** DeviceInfoResponse model. */
        public model: string;

        /** DeviceInfoResponse firmware. */
        public firmware: string;

        /** DeviceInfoResponse revision. */
        public revision: string;

        /** DeviceInfoResponse pairing. */
        public pairing: boolean;

        /** DeviceInfoResponse customHeartbeatUrl. */
        public customHeartbeatUrl: string;

        /** DeviceInfoResponse telemetry. */
        public telemetry: boolean;

        /** DeviceInfoResponse managedBy. */
        public managedBy: string;

        /** DeviceInfoResponse attestationDacDer. */
        public attestationDacDer: Uint8Array;

        /** DeviceInfoResponse attestationManufacturerDer. */
        public attestationManufacturerDer: Uint8Array;

        /** DeviceInfoResponse attestationIntermediateDer. */
        public attestationIntermediateDer: Uint8Array;

        /** DeviceInfoResponse attestationRootFingerprint. */
        public attestationRootFingerprint: string;

        /** DeviceInfoResponse heartbeatSlacDer. */
        public heartbeatSlacDer: Uint8Array;

        /** DeviceInfoResponse heartbeatDer. */
        public heartbeatDer: Uint8Array;

        /** DeviceInfoResponse heartbeatIntermediateDer. */
        public heartbeatIntermediateDer: Uint8Array;

        /** DeviceInfoResponse heartbeatRootFingerprint. */
        public heartbeatRootFingerprint: string;

        /** DeviceInfoResponse signature. */
        public signature: Uint8Array;

        /** DeviceInfoResponse key. */
        public key: Uint8Array;

        /**
         * Creates a new DeviceInfoResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DeviceInfoResponse instance
         */
        public static create(properties?: lukuid.IDeviceInfoResponse): lukuid.DeviceInfoResponse;

        /**
         * Encodes the specified DeviceInfoResponse message. Does not implicitly {@link lukuid.DeviceInfoResponse.verify|verify} messages.
         * @param message DeviceInfoResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IDeviceInfoResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DeviceInfoResponse message, length delimited. Does not implicitly {@link lukuid.DeviceInfoResponse.verify|verify} messages.
         * @param message DeviceInfoResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IDeviceInfoResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DeviceInfoResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DeviceInfoResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.DeviceInfoResponse;

        /**
         * Decodes a DeviceInfoResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DeviceInfoResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.DeviceInfoResponse;

        /**
         * Verifies a DeviceInfoResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DeviceInfoResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DeviceInfoResponse
         */
        public static fromObject(object: { [k: string]: any }): lukuid.DeviceInfoResponse;

        /**
         * Creates a plain object from a DeviceInfoResponse message. Also converts values to other types if specified.
         * @param message DeviceInfoResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.DeviceInfoResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DeviceInfoResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for DeviceInfoResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a StatusResponse. */
    interface IStatusResponse {

        /** StatusResponse id */
        id?: (string|null);

        /** StatusResponse name */
        name?: (string|null);

        /** StatusResponse publicKey */
        publicKey?: (Uint8Array|null);

        /** StatusResponse batteryHealth */
        batteryHealth?: (number|null);

        /** StatusResponse timestamp */
        timestamp?: (number|Long|null);

        /** StatusResponse hasAttestation */
        hasAttestation?: (boolean|null);

        /** StatusResponse hasHeartbeat */
        hasHeartbeat?: (boolean|null);

        /** StatusResponse needsSync */
        needsSync?: (boolean|null);

        /** StatusResponse product */
        product?: (string|null);

        /** StatusResponse model */
        model?: (string|null);
    }

    /** Represents a StatusResponse. */
    class StatusResponse implements IStatusResponse {

        /**
         * Constructs a new StatusResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IStatusResponse);

        /** StatusResponse id. */
        public id: string;

        /** StatusResponse name. */
        public name: string;

        /** StatusResponse publicKey. */
        public publicKey: Uint8Array;

        /** StatusResponse batteryHealth. */
        public batteryHealth: number;

        /** StatusResponse timestamp. */
        public timestamp: (number|Long);

        /** StatusResponse hasAttestation. */
        public hasAttestation: boolean;

        /** StatusResponse hasHeartbeat. */
        public hasHeartbeat: boolean;

        /** StatusResponse needsSync. */
        public needsSync: boolean;

        /** StatusResponse product. */
        public product: string;

        /** StatusResponse model. */
        public model: string;

        /**
         * Creates a new StatusResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns StatusResponse instance
         */
        public static create(properties?: lukuid.IStatusResponse): lukuid.StatusResponse;

        /**
         * Encodes the specified StatusResponse message. Does not implicitly {@link lukuid.StatusResponse.verify|verify} messages.
         * @param message StatusResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IStatusResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified StatusResponse message, length delimited. Does not implicitly {@link lukuid.StatusResponse.verify|verify} messages.
         * @param message StatusResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IStatusResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a StatusResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns StatusResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.StatusResponse;

        /**
         * Decodes a StatusResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns StatusResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.StatusResponse;

        /**
         * Verifies a StatusResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a StatusResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns StatusResponse
         */
        public static fromObject(object: { [k: string]: any }): lukuid.StatusResponse;

        /**
         * Creates a plain object from a StatusResponse message. Also converts values to other types if specified.
         * @param message StatusResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.StatusResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this StatusResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for StatusResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a NetworkConfigResponse. */
    interface INetworkConfigResponse {

        /** NetworkConfigResponse wifiSsid */
        wifiSsid?: (string|null);

        /** NetworkConfigResponse wifiPasswordSet */
        wifiPasswordSet?: (boolean|null);

        /** NetworkConfigResponse mqttBrokerUrl */
        mqttBrokerUrl?: (string|null);

        /** NetworkConfigResponse mqttPort */
        mqttPort?: (number|null);

        /** NetworkConfigResponse mqttTopic */
        mqttTopic?: (string|null);

        /** NetworkConfigResponse mqttBroadcastFrequencySeconds */
        mqttBroadcastFrequencySeconds?: (number|null);

        /** NetworkConfigResponse mqttUsername */
        mqttUsername?: (string|null);

        /** NetworkConfigResponse mqttPasswordSet */
        mqttPasswordSet?: (boolean|null);

        /** NetworkConfigResponse mqttBroadcastEnabled */
        mqttBroadcastEnabled?: (boolean|null);

        /** NetworkConfigResponse csr */
        csr?: (Uint8Array|null);

        /** NetworkConfigResponse mqttCertificateDer */
        mqttCertificateDer?: (Uint8Array|null);

        /** NetworkConfigResponse mqttCaDer */
        mqttCaDer?: (Uint8Array|null);
    }

    /** Represents a NetworkConfigResponse. */
    class NetworkConfigResponse implements INetworkConfigResponse {

        /**
         * Constructs a new NetworkConfigResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.INetworkConfigResponse);

        /** NetworkConfigResponse wifiSsid. */
        public wifiSsid: string;

        /** NetworkConfigResponse wifiPasswordSet. */
        public wifiPasswordSet: boolean;

        /** NetworkConfigResponse mqttBrokerUrl. */
        public mqttBrokerUrl: string;

        /** NetworkConfigResponse mqttPort. */
        public mqttPort: number;

        /** NetworkConfigResponse mqttTopic. */
        public mqttTopic: string;

        /** NetworkConfigResponse mqttBroadcastFrequencySeconds. */
        public mqttBroadcastFrequencySeconds: number;

        /** NetworkConfigResponse mqttUsername. */
        public mqttUsername: string;

        /** NetworkConfigResponse mqttPasswordSet. */
        public mqttPasswordSet: boolean;

        /** NetworkConfigResponse mqttBroadcastEnabled. */
        public mqttBroadcastEnabled: boolean;

        /** NetworkConfigResponse csr. */
        public csr: Uint8Array;

        /** NetworkConfigResponse mqttCertificateDer. */
        public mqttCertificateDer: Uint8Array;

        /** NetworkConfigResponse mqttCaDer. */
        public mqttCaDer: Uint8Array;

        /**
         * Creates a new NetworkConfigResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns NetworkConfigResponse instance
         */
        public static create(properties?: lukuid.INetworkConfigResponse): lukuid.NetworkConfigResponse;

        /**
         * Encodes the specified NetworkConfigResponse message. Does not implicitly {@link lukuid.NetworkConfigResponse.verify|verify} messages.
         * @param message NetworkConfigResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.INetworkConfigResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified NetworkConfigResponse message, length delimited. Does not implicitly {@link lukuid.NetworkConfigResponse.verify|verify} messages.
         * @param message NetworkConfigResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.INetworkConfigResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a NetworkConfigResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns NetworkConfigResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.NetworkConfigResponse;

        /**
         * Decodes a NetworkConfigResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns NetworkConfigResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.NetworkConfigResponse;

        /**
         * Verifies a NetworkConfigResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a NetworkConfigResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns NetworkConfigResponse
         */
        public static fromObject(object: { [k: string]: any }): lukuid.NetworkConfigResponse;

        /**
         * Creates a plain object from a NetworkConfigResponse message. Also converts values to other types if specified.
         * @param message NetworkConfigResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.NetworkConfigResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this NetworkConfigResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for NetworkConfigResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RecordMeta. */
    interface IRecordMeta {

        /** RecordMeta timestampUtc */
        timestampUtc?: (number|Long|null);

        /** RecordMeta deviceId */
        deviceId?: (number|null);

        /** RecordMeta recordId */
        recordId?: (string|null);
    }

    /** Represents a RecordMeta. */
    class RecordMeta implements IRecordMeta {

        /**
         * Constructs a new RecordMeta.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IRecordMeta);

        /** RecordMeta timestampUtc. */
        public timestampUtc: (number|Long);

        /** RecordMeta deviceId. */
        public deviceId: number;

        /** RecordMeta recordId. */
        public recordId: string;

        /**
         * Creates a new RecordMeta instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RecordMeta instance
         */
        public static create(properties?: lukuid.IRecordMeta): lukuid.RecordMeta;

        /**
         * Encodes the specified RecordMeta message. Does not implicitly {@link lukuid.RecordMeta.verify|verify} messages.
         * @param message RecordMeta message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IRecordMeta, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RecordMeta message, length delimited. Does not implicitly {@link lukuid.RecordMeta.verify|verify} messages.
         * @param message RecordMeta message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IRecordMeta, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RecordMeta message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RecordMeta
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.RecordMeta;

        /**
         * Decodes a RecordMeta message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RecordMeta
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.RecordMeta;

        /**
         * Verifies a RecordMeta message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RecordMeta message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RecordMeta
         */
        public static fromObject(object: { [k: string]: any }): lukuid.RecordMeta;

        /**
         * Creates a plain object from a RecordMeta message. Also converts values to other types if specified.
         * @param message RecordMeta
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.RecordMeta, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RecordMeta to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for RecordMeta
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ScanRecordMin. */
    interface IScanRecordMin {

        /** ScanRecordMin version */
        version?: (string|null);

        /** ScanRecordMin recordId */
        recordId?: (string|null);

        /** ScanRecordMin timestampUtc */
        timestampUtc?: (number|Long|null);

        /** ScanRecordMin tagId */
        tagId?: (string|null);

        /** ScanRecordMin scoreBio */
        scoreBio?: (number|null);

        /** ScanRecordMin scoreAuth */
        scoreAuth?: (number|null);

        /** ScanRecordMin scoreEnv */
        scoreEnv?: (number|null);
    }

    /** Represents a ScanRecordMin. */
    class ScanRecordMin implements IScanRecordMin {

        /**
         * Constructs a new ScanRecordMin.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IScanRecordMin);

        /** ScanRecordMin version. */
        public version: string;

        /** ScanRecordMin recordId. */
        public recordId: string;

        /** ScanRecordMin timestampUtc. */
        public timestampUtc: (number|Long);

        /** ScanRecordMin tagId. */
        public tagId: string;

        /** ScanRecordMin scoreBio. */
        public scoreBio: number;

        /** ScanRecordMin scoreAuth. */
        public scoreAuth: number;

        /** ScanRecordMin scoreEnv. */
        public scoreEnv: number;

        /**
         * Creates a new ScanRecordMin instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ScanRecordMin instance
         */
        public static create(properties?: lukuid.IScanRecordMin): lukuid.ScanRecordMin;

        /**
         * Encodes the specified ScanRecordMin message. Does not implicitly {@link lukuid.ScanRecordMin.verify|verify} messages.
         * @param message ScanRecordMin message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IScanRecordMin, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ScanRecordMin message, length delimited. Does not implicitly {@link lukuid.ScanRecordMin.verify|verify} messages.
         * @param message ScanRecordMin message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IScanRecordMin, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ScanRecordMin message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ScanRecordMin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.ScanRecordMin;

        /**
         * Decodes a ScanRecordMin message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ScanRecordMin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.ScanRecordMin;

        /**
         * Verifies a ScanRecordMin message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ScanRecordMin message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ScanRecordMin
         */
        public static fromObject(object: { [k: string]: any }): lukuid.ScanRecordMin;

        /**
         * Creates a plain object from a ScanRecordMin message. Also converts values to other types if specified.
         * @param message ScanRecordMin
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.ScanRecordMin, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ScanRecordMin to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ScanRecordMin
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an EnvironmentRecordMin. */
    interface IEnvironmentRecordMin {

        /** EnvironmentRecordMin version */
        version?: (string|null);

        /** EnvironmentRecordMin recordId */
        recordId?: (string|null);

        /** EnvironmentRecordMin timestampUtc */
        timestampUtc?: (number|Long|null);

        /** EnvironmentRecordMin lux */
        lux?: (lukuid.IMetricValue|null);

        /** EnvironmentRecordMin tempC */
        tempC?: (lukuid.IMetricValue|null);

        /** EnvironmentRecordMin humidityPct */
        humidityPct?: (lukuid.IMetricValue|null);

        /** EnvironmentRecordMin vocIndex */
        vocIndex?: (lukuid.IMetricValue|null);

        /** EnvironmentRecordMin tamper */
        tamper?: (boolean|null);

        /** EnvironmentRecordMin wakeEvent */
        wakeEvent?: (boolean|null);

        /** EnvironmentRecordMin vbusPresent */
        vbusPresent?: (boolean|null);
    }

    /** Represents an EnvironmentRecordMin. */
    class EnvironmentRecordMin implements IEnvironmentRecordMin {

        /**
         * Constructs a new EnvironmentRecordMin.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IEnvironmentRecordMin);

        /** EnvironmentRecordMin version. */
        public version: string;

        /** EnvironmentRecordMin recordId. */
        public recordId: string;

        /** EnvironmentRecordMin timestampUtc. */
        public timestampUtc: (number|Long);

        /** EnvironmentRecordMin lux. */
        public lux?: (lukuid.IMetricValue|null);

        /** EnvironmentRecordMin tempC. */
        public tempC?: (lukuid.IMetricValue|null);

        /** EnvironmentRecordMin humidityPct. */
        public humidityPct?: (lukuid.IMetricValue|null);

        /** EnvironmentRecordMin vocIndex. */
        public vocIndex?: (lukuid.IMetricValue|null);

        /** EnvironmentRecordMin tamper. */
        public tamper: boolean;

        /** EnvironmentRecordMin wakeEvent. */
        public wakeEvent: boolean;

        /** EnvironmentRecordMin vbusPresent. */
        public vbusPresent: boolean;

        /**
         * Creates a new EnvironmentRecordMin instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EnvironmentRecordMin instance
         */
        public static create(properties?: lukuid.IEnvironmentRecordMin): lukuid.EnvironmentRecordMin;

        /**
         * Encodes the specified EnvironmentRecordMin message. Does not implicitly {@link lukuid.EnvironmentRecordMin.verify|verify} messages.
         * @param message EnvironmentRecordMin message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IEnvironmentRecordMin, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EnvironmentRecordMin message, length delimited. Does not implicitly {@link lukuid.EnvironmentRecordMin.verify|verify} messages.
         * @param message EnvironmentRecordMin message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IEnvironmentRecordMin, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EnvironmentRecordMin message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EnvironmentRecordMin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.EnvironmentRecordMin;

        /**
         * Decodes an EnvironmentRecordMin message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EnvironmentRecordMin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.EnvironmentRecordMin;

        /**
         * Verifies an EnvironmentRecordMin message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EnvironmentRecordMin message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EnvironmentRecordMin
         */
        public static fromObject(object: { [k: string]: any }): lukuid.EnvironmentRecordMin;

        /**
         * Creates a plain object from an EnvironmentRecordMin message. Also converts values to other types if specified.
         * @param message EnvironmentRecordMin
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.EnvironmentRecordMin, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EnvironmentRecordMin to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for EnvironmentRecordMin
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a DataEntry. */
    interface IDataEntry {

        /** DataEntry scanMin */
        scanMin?: (lukuid.IScanRecordMin|null);

        /** DataEntry environmentMin */
        environmentMin?: (lukuid.IEnvironmentRecordMin|null);
    }

    /** Represents a DataEntry. */
    class DataEntry implements IDataEntry {

        /**
         * Constructs a new DataEntry.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IDataEntry);

        /** DataEntry scanMin. */
        public scanMin?: (lukuid.IScanRecordMin|null);

        /** DataEntry environmentMin. */
        public environmentMin?: (lukuid.IEnvironmentRecordMin|null);

        /** DataEntry minRecord. */
        public minRecord?: ("scanMin"|"environmentMin");

        /**
         * Creates a new DataEntry instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DataEntry instance
         */
        public static create(properties?: lukuid.IDataEntry): lukuid.DataEntry;

        /**
         * Encodes the specified DataEntry message. Does not implicitly {@link lukuid.DataEntry.verify|verify} messages.
         * @param message DataEntry message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IDataEntry, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DataEntry message, length delimited. Does not implicitly {@link lukuid.DataEntry.verify|verify} messages.
         * @param message DataEntry message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IDataEntry, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DataEntry message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DataEntry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.DataEntry;

        /**
         * Decodes a DataEntry message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DataEntry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.DataEntry;

        /**
         * Verifies a DataEntry message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DataEntry message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DataEntry
         */
        public static fromObject(object: { [k: string]: any }): lukuid.DataEntry;

        /**
         * Creates a plain object from a DataEntry message. Also converts values to other types if specified.
         * @param message DataEntry
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.DataEntry, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DataEntry to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for DataEntry
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a FetchResponse. */
    interface IFetchResponse {

        /** FetchResponse data */
        data?: (lukuid.IDataEntry[]|null);
    }

    /** Represents a FetchResponse. */
    class FetchResponse implements IFetchResponse {

        /**
         * Constructs a new FetchResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IFetchResponse);

        /** FetchResponse data. */
        public data: lukuid.IDataEntry[];

        /**
         * Creates a new FetchResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FetchResponse instance
         */
        public static create(properties?: lukuid.IFetchResponse): lukuid.FetchResponse;

        /**
         * Encodes the specified FetchResponse message. Does not implicitly {@link lukuid.FetchResponse.verify|verify} messages.
         * @param message FetchResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IFetchResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FetchResponse message, length delimited. Does not implicitly {@link lukuid.FetchResponse.verify|verify} messages.
         * @param message FetchResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IFetchResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FetchResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FetchResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.FetchResponse;

        /**
         * Decodes a FetchResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FetchResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.FetchResponse;

        /**
         * Verifies a FetchResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FetchResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FetchResponse
         */
        public static fromObject(object: { [k: string]: any }): lukuid.FetchResponse;

        /**
         * Creates a plain object from a FetchResponse message. Also converts values to other types if specified.
         * @param message FetchResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.FetchResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FetchResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for FetchResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ScanPayload. */
    interface IScanPayload {

        /** ScanPayload ctr */
        ctr?: (number|Long|null);

        /** ScanPayload id */
        id?: (string|null);

        /** ScanPayload timestampUtc */
        timestampUtc?: (number|Long|null);

        /** ScanPayload uptimeUs */
        uptimeUs?: (number|Long|null);

        /** ScanPayload temperatureC */
        temperatureC?: (number|null);

        /** ScanPayload nonce */
        nonce?: (string|null);

        /** ScanPayload firmware */
        firmware?: (string|null);

        /** ScanPayload genesisHash */
        genesisHash?: (string|null);

        /** ScanPayload tmp */
        tmp?: (number|null);

        /** ScanPayload hum */
        hum?: (number|null);

        /** ScanPayload rssi */
        rssi?: (number|null);

        /** ScanPayload jit */
        jit?: (number|null);

        /** ScanPayload lat */
        lat?: (number|null);

        /** ScanPayload dur */
        dur?: (number|null);

        /** ScanPayload vSag */
        vSag?: (number|null);

        /** ScanPayload vAvg */
        vAvg?: (number|null);

        /** ScanPayload pCnt */
        pCnt?: (number|null);

        /** ScanPayload avgDur */
        avgDur?: (number|null);

        /** ScanPayload scSync */
        scSync?: (number|null);

        /** ScanPayload upTimeM */
        upTimeM?: (number|null);

        /** ScanPayload vDrop */
        vDrop?: (number|null);

        /** ScanPayload rssiStd */
        rssiStd?: (number|null);

        /** ScanPayload vbus */
        vbus?: (number|null);

        /** ScanPayload clkVar */
        clkVar?: (number|null);

        /** ScanPayload drift */
        drift?: (number|null);

        /** ScanPayload hdxHistoCsv */
        hdxHistoCsv?: (string|null);

        /** ScanPayload scoreBio */
        scoreBio?: (number|null);

        /** ScanPayload scoreAuth */
        scoreAuth?: (number|null);

        /** ScanPayload scoreEnv */
        scoreEnv?: (number|null);

        /** ScanPayload metricsKeys */
        metricsKeys?: (string|null);

        /** ScanPayload scanVersion */
        scanVersion?: (string|null);
    }

    /** Represents a ScanPayload. */
    class ScanPayload implements IScanPayload {

        /**
         * Constructs a new ScanPayload.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IScanPayload);

        /** ScanPayload ctr. */
        public ctr: (number|Long);

        /** ScanPayload id. */
        public id: string;

        /** ScanPayload timestampUtc. */
        public timestampUtc: (number|Long);

        /** ScanPayload uptimeUs. */
        public uptimeUs: (number|Long);

        /** ScanPayload temperatureC. */
        public temperatureC: number;

        /** ScanPayload nonce. */
        public nonce: string;

        /** ScanPayload firmware. */
        public firmware: string;

        /** ScanPayload genesisHash. */
        public genesisHash: string;

        /** ScanPayload tmp. */
        public tmp: number;

        /** ScanPayload hum. */
        public hum: number;

        /** ScanPayload rssi. */
        public rssi: number;

        /** ScanPayload jit. */
        public jit: number;

        /** ScanPayload lat. */
        public lat: number;

        /** ScanPayload dur. */
        public dur: number;

        /** ScanPayload vSag. */
        public vSag: number;

        /** ScanPayload vAvg. */
        public vAvg: number;

        /** ScanPayload pCnt. */
        public pCnt: number;

        /** ScanPayload avgDur. */
        public avgDur: number;

        /** ScanPayload scSync. */
        public scSync: number;

        /** ScanPayload upTimeM. */
        public upTimeM: number;

        /** ScanPayload vDrop. */
        public vDrop: number;

        /** ScanPayload rssiStd. */
        public rssiStd: number;

        /** ScanPayload vbus. */
        public vbus: number;

        /** ScanPayload clkVar. */
        public clkVar: number;

        /** ScanPayload drift. */
        public drift: number;

        /** ScanPayload hdxHistoCsv. */
        public hdxHistoCsv: string;

        /** ScanPayload scoreBio. */
        public scoreBio: number;

        /** ScanPayload scoreAuth. */
        public scoreAuth: number;

        /** ScanPayload scoreEnv. */
        public scoreEnv: number;

        /** ScanPayload metricsKeys. */
        public metricsKeys: string;

        /** ScanPayload scanVersion. */
        public scanVersion: string;

        /**
         * Creates a new ScanPayload instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ScanPayload instance
         */
        public static create(properties?: lukuid.IScanPayload): lukuid.ScanPayload;

        /**
         * Encodes the specified ScanPayload message. Does not implicitly {@link lukuid.ScanPayload.verify|verify} messages.
         * @param message ScanPayload message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IScanPayload, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ScanPayload message, length delimited. Does not implicitly {@link lukuid.ScanPayload.verify|verify} messages.
         * @param message ScanPayload message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IScanPayload, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ScanPayload message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ScanPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.ScanPayload;

        /**
         * Decodes a ScanPayload message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ScanPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.ScanPayload;

        /**
         * Verifies a ScanPayload message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ScanPayload message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ScanPayload
         */
        public static fromObject(object: { [k: string]: any }): lukuid.ScanPayload;

        /**
         * Creates a plain object from a ScanPayload message. Also converts values to other types if specified.
         * @param message ScanPayload
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.ScanPayload, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ScanPayload to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ScanPayload
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a DeviceInfo. */
    interface IDeviceInfo {

        /** DeviceInfo deviceId */
        deviceId?: (string|null);

        /** DeviceInfo publicKey */
        publicKey?: (Uint8Array|null);
    }

    /** Represents a DeviceInfo. */
    class DeviceInfo implements IDeviceInfo {

        /**
         * Constructs a new DeviceInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IDeviceInfo);

        /** DeviceInfo deviceId. */
        public deviceId: string;

        /** DeviceInfo publicKey. */
        public publicKey: Uint8Array;

        /**
         * Creates a new DeviceInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DeviceInfo instance
         */
        public static create(properties?: lukuid.IDeviceInfo): lukuid.DeviceInfo;

        /**
         * Encodes the specified DeviceInfo message. Does not implicitly {@link lukuid.DeviceInfo.verify|verify} messages.
         * @param message DeviceInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IDeviceInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DeviceInfo message, length delimited. Does not implicitly {@link lukuid.DeviceInfo.verify|verify} messages.
         * @param message DeviceInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IDeviceInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DeviceInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DeviceInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.DeviceInfo;

        /**
         * Decodes a DeviceInfo message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DeviceInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.DeviceInfo;

        /**
         * Verifies a DeviceInfo message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DeviceInfo message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DeviceInfo
         */
        public static fromObject(object: { [k: string]: any }): lukuid.DeviceInfo;

        /**
         * Creates a plain object from a DeviceInfo message. Also converts values to other types if specified.
         * @param message DeviceInfo
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.DeviceInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DeviceInfo to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for DeviceInfo
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ManufacturerInfo. */
    interface IManufacturerInfo {

        /** ManufacturerInfo signature */
        signature?: (Uint8Array|null);

        /** ManufacturerInfo publicKey */
        publicKey?: (Uint8Array|null);
    }

    /** Represents a ManufacturerInfo. */
    class ManufacturerInfo implements IManufacturerInfo {

        /**
         * Constructs a new ManufacturerInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IManufacturerInfo);

        /** ManufacturerInfo signature. */
        public signature: Uint8Array;

        /** ManufacturerInfo publicKey. */
        public publicKey: Uint8Array;

        /**
         * Creates a new ManufacturerInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ManufacturerInfo instance
         */
        public static create(properties?: lukuid.IManufacturerInfo): lukuid.ManufacturerInfo;

        /**
         * Encodes the specified ManufacturerInfo message. Does not implicitly {@link lukuid.ManufacturerInfo.verify|verify} messages.
         * @param message ManufacturerInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IManufacturerInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ManufacturerInfo message, length delimited. Does not implicitly {@link lukuid.ManufacturerInfo.verify|verify} messages.
         * @param message ManufacturerInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IManufacturerInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ManufacturerInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ManufacturerInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.ManufacturerInfo;

        /**
         * Decodes a ManufacturerInfo message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ManufacturerInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.ManufacturerInfo;

        /**
         * Verifies a ManufacturerInfo message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ManufacturerInfo message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ManufacturerInfo
         */
        public static fromObject(object: { [k: string]: any }): lukuid.ManufacturerInfo;

        /**
         * Creates a plain object from a ManufacturerInfo message. Also converts values to other types if specified.
         * @param message ManufacturerInfo
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.ManufacturerInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ManufacturerInfo to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ManufacturerInfo
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an Identity. */
    interface IIdentity {

        /** Identity identityVersion */
        identityVersion?: (number|Long|null);

        /** Identity dacSerial */
        dacSerial?: (string|null);

        /** Identity slacSerial */
        slacSerial?: (string|null);

        /** Identity lastSyncUtc */
        lastSyncUtc?: (number|Long|null);

        /** Identity signature */
        signature?: (Uint8Array|null);

        /** Identity dacDer */
        dacDer?: (Uint8Array|null);

        /** Identity slacDer */
        slacDer?: (Uint8Array|null);

        /** Identity attestationManufacturerDer */
        attestationManufacturerDer?: (Uint8Array|null);

        /** Identity attestationIntermediateDer */
        attestationIntermediateDer?: (Uint8Array|null);

        /** Identity attestationRootFingerprint */
        attestationRootFingerprint?: (string|null);

        /** Identity heartbeatDer */
        heartbeatDer?: (Uint8Array|null);

        /** Identity heartbeatIntermediateDer */
        heartbeatIntermediateDer?: (Uint8Array|null);

        /** Identity heartbeatRootFingerprint */
        heartbeatRootFingerprint?: (string|null);

        /** Identity alg */
        alg?: (string|null);
    }

    /** Represents an Identity. */
    class Identity implements IIdentity {

        /**
         * Constructs a new Identity.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IIdentity);

        /** Identity identityVersion. */
        public identityVersion: (number|Long);

        /** Identity dacSerial. */
        public dacSerial: string;

        /** Identity slacSerial. */
        public slacSerial: string;

        /** Identity lastSyncUtc. */
        public lastSyncUtc: (number|Long);

        /** Identity signature. */
        public signature: Uint8Array;

        /** Identity dacDer. */
        public dacDer: Uint8Array;

        /** Identity slacDer. */
        public slacDer: Uint8Array;

        /** Identity attestationManufacturerDer. */
        public attestationManufacturerDer: Uint8Array;

        /** Identity attestationIntermediateDer. */
        public attestationIntermediateDer: Uint8Array;

        /** Identity attestationRootFingerprint. */
        public attestationRootFingerprint: string;

        /** Identity heartbeatDer. */
        public heartbeatDer: Uint8Array;

        /** Identity heartbeatIntermediateDer. */
        public heartbeatIntermediateDer: Uint8Array;

        /** Identity heartbeatRootFingerprint. */
        public heartbeatRootFingerprint: string;

        /** Identity alg. */
        public alg: string;

        /**
         * Creates a new Identity instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Identity instance
         */
        public static create(properties?: lukuid.IIdentity): lukuid.Identity;

        /**
         * Encodes the specified Identity message. Does not implicitly {@link lukuid.Identity.verify|verify} messages.
         * @param message Identity message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IIdentity, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Identity message, length delimited. Does not implicitly {@link lukuid.Identity.verify|verify} messages.
         * @param message Identity message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IIdentity, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Identity message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Identity
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.Identity;

        /**
         * Decodes an Identity message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Identity
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.Identity;

        /**
         * Verifies an Identity message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Identity message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Identity
         */
        public static fromObject(object: { [k: string]: any }): lukuid.Identity;

        /**
         * Creates a plain object from an Identity message. Also converts values to other types if specified.
         * @param message Identity
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.Identity, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Identity to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Identity
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an Attachment. */
    interface IAttachment {

        /** Attachment signature */
        signature?: (Uint8Array|null);

        /** Attachment checksum */
        checksum?: (string|null);

        /** Attachment timestampUtc */
        timestampUtc?: (number|Long|null);

        /** Attachment mime */
        mime?: (string|null);

        /** Attachment externalIdentity */
        externalIdentity?: (lukuid.IExternalIdentity|null);

        /** Attachment type */
        type?: (string|null);

        /** Attachment title */
        title?: (string|null);

        /** Attachment lat */
        lat?: (number|null);

        /** Attachment lng */
        lng?: (number|null);

        /** Attachment content */
        content?: (string|null);

        /** Attachment merkleRoot */
        merkleRoot?: (string|null);

        /** Attachment alg */
        alg?: (string|null);
    }

    /** Represents an Attachment. */
    class Attachment implements IAttachment {

        /**
         * Constructs a new Attachment.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IAttachment);

        /** Attachment signature. */
        public signature: Uint8Array;

        /** Attachment checksum. */
        public checksum: string;

        /** Attachment timestampUtc. */
        public timestampUtc: (number|Long);

        /** Attachment mime. */
        public mime: string;

        /** Attachment externalIdentity. */
        public externalIdentity?: (lukuid.IExternalIdentity|null);

        /** Attachment type. */
        public type: string;

        /** Attachment title. */
        public title: string;

        /** Attachment lat. */
        public lat: number;

        /** Attachment lng. */
        public lng: number;

        /** Attachment content. */
        public content: string;

        /** Attachment merkleRoot. */
        public merkleRoot: string;

        /** Attachment alg. */
        public alg: string;

        /**
         * Creates a new Attachment instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Attachment instance
         */
        public static create(properties?: lukuid.IAttachment): lukuid.Attachment;

        /**
         * Encodes the specified Attachment message. Does not implicitly {@link lukuid.Attachment.verify|verify} messages.
         * @param message Attachment message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IAttachment, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Attachment message, length delimited. Does not implicitly {@link lukuid.Attachment.verify|verify} messages.
         * @param message Attachment message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IAttachment, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Attachment message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Attachment
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.Attachment;

        /**
         * Decodes an Attachment message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Attachment
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.Attachment;

        /**
         * Verifies an Attachment message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Attachment message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Attachment
         */
        public static fromObject(object: { [k: string]: any }): lukuid.Attachment;

        /**
         * Creates a plain object from an Attachment message. Also converts values to other types if specified.
         * @param message Attachment
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.Attachment, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Attachment to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Attachment
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an ExternalIdentity. */
    interface IExternalIdentity {

        /** ExternalIdentity endorserId */
        endorserId?: (string|null);

        /** ExternalIdentity rootFingerprint */
        rootFingerprint?: (string|null);

        /** ExternalIdentity certChainDer */
        certChainDer?: (Uint8Array[]|null);

        /** ExternalIdentity signature */
        signature?: (Uint8Array|null);
    }

    /** Represents an ExternalIdentity. */
    class ExternalIdentity implements IExternalIdentity {

        /**
         * Constructs a new ExternalIdentity.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IExternalIdentity);

        /** ExternalIdentity endorserId. */
        public endorserId: string;

        /** ExternalIdentity rootFingerprint. */
        public rootFingerprint: string;

        /** ExternalIdentity certChainDer. */
        public certChainDer: Uint8Array[];

        /** ExternalIdentity signature. */
        public signature: Uint8Array;

        /**
         * Creates a new ExternalIdentity instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ExternalIdentity instance
         */
        public static create(properties?: lukuid.IExternalIdentity): lukuid.ExternalIdentity;

        /**
         * Encodes the specified ExternalIdentity message. Does not implicitly {@link lukuid.ExternalIdentity.verify|verify} messages.
         * @param message ExternalIdentity message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IExternalIdentity, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ExternalIdentity message, length delimited. Does not implicitly {@link lukuid.ExternalIdentity.verify|verify} messages.
         * @param message ExternalIdentity message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IExternalIdentity, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an ExternalIdentity message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ExternalIdentity
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.ExternalIdentity;

        /**
         * Decodes an ExternalIdentity message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ExternalIdentity
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.ExternalIdentity;

        /**
         * Verifies an ExternalIdentity message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an ExternalIdentity message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ExternalIdentity
         */
        public static fromObject(object: { [k: string]: any }): lukuid.ExternalIdentity;

        /**
         * Creates a plain object from an ExternalIdentity message. Also converts values to other types if specified.
         * @param message ExternalIdentity
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.ExternalIdentity, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ExternalIdentity to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ExternalIdentity
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an AttachmentRecord. */
    interface IAttachmentRecord {

        /** AttachmentRecord version */
        version?: (string|null);

        /** AttachmentRecord attachmentId */
        attachmentId?: (string|null);

        /** AttachmentRecord parentRecordId */
        parentRecordId?: (string|null);

        /** AttachmentRecord signature */
        signature?: (Uint8Array|null);

        /** AttachmentRecord parentSignature */
        parentSignature?: (Uint8Array|null);

        /** AttachmentRecord checksum */
        checksum?: (string|null);

        /** AttachmentRecord timestampUtc */
        timestampUtc?: (number|Long|null);

        /** AttachmentRecord mime */
        mime?: (string|null);

        /** AttachmentRecord type */
        type?: (string|null);

        /** AttachmentRecord title */
        title?: (string|null);

        /** AttachmentRecord lat */
        lat?: (number|null);

        /** AttachmentRecord lng */
        lng?: (number|null);

        /** AttachmentRecord content */
        content?: (string|null);

        /** AttachmentRecord merkleRoot */
        merkleRoot?: (string|null);

        /** AttachmentRecord alg */
        alg?: (string|null);

        /** AttachmentRecord externalIdentity */
        externalIdentity?: (lukuid.IExternalIdentity|null);

        /** AttachmentRecord custodyId */
        custodyId?: (string|null);

        /** AttachmentRecord event */
        event?: (string|null);

        /** AttachmentRecord canonicalString */
        canonicalString?: (string|null);

        /** AttachmentRecord status */
        status?: (string|null);

        /** AttachmentRecord contextRef */
        contextRef?: (string|null);
    }

    /** Represents an AttachmentRecord. */
    class AttachmentRecord implements IAttachmentRecord {

        /**
         * Constructs a new AttachmentRecord.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IAttachmentRecord);

        /** AttachmentRecord version. */
        public version: string;

        /** AttachmentRecord attachmentId. */
        public attachmentId: string;

        /** AttachmentRecord parentRecordId. */
        public parentRecordId: string;

        /** AttachmentRecord signature. */
        public signature: Uint8Array;

        /** AttachmentRecord parentSignature. */
        public parentSignature: Uint8Array;

        /** AttachmentRecord checksum. */
        public checksum: string;

        /** AttachmentRecord timestampUtc. */
        public timestampUtc: (number|Long);

        /** AttachmentRecord mime. */
        public mime: string;

        /** AttachmentRecord type. */
        public type: string;

        /** AttachmentRecord title. */
        public title: string;

        /** AttachmentRecord lat. */
        public lat: number;

        /** AttachmentRecord lng. */
        public lng: number;

        /** AttachmentRecord content. */
        public content: string;

        /** AttachmentRecord merkleRoot. */
        public merkleRoot: string;

        /** AttachmentRecord alg. */
        public alg: string;

        /** AttachmentRecord externalIdentity. */
        public externalIdentity?: (lukuid.IExternalIdentity|null);

        /** AttachmentRecord custodyId. */
        public custodyId: string;

        /** AttachmentRecord event. */
        public event: string;

        /** AttachmentRecord canonicalString. */
        public canonicalString: string;

        /** AttachmentRecord status. */
        public status: string;

        /** AttachmentRecord contextRef. */
        public contextRef: string;

        /**
         * Creates a new AttachmentRecord instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AttachmentRecord instance
         */
        public static create(properties?: lukuid.IAttachmentRecord): lukuid.AttachmentRecord;

        /**
         * Encodes the specified AttachmentRecord message. Does not implicitly {@link lukuid.AttachmentRecord.verify|verify} messages.
         * @param message AttachmentRecord message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IAttachmentRecord, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AttachmentRecord message, length delimited. Does not implicitly {@link lukuid.AttachmentRecord.verify|verify} messages.
         * @param message AttachmentRecord message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IAttachmentRecord, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AttachmentRecord message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AttachmentRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.AttachmentRecord;

        /**
         * Decodes an AttachmentRecord message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AttachmentRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.AttachmentRecord;

        /**
         * Verifies an AttachmentRecord message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AttachmentRecord message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AttachmentRecord
         */
        public static fromObject(object: { [k: string]: any }): lukuid.AttachmentRecord;

        /**
         * Creates a plain object from an AttachmentRecord message. Also converts values to other types if specified.
         * @param message AttachmentRecord
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.AttachmentRecord, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AttachmentRecord to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for AttachmentRecord
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ScanRecord. */
    interface IScanRecord {

        /** ScanRecord version */
        version?: (string|null);

        /** ScanRecord scanId */
        scanId?: (string|null);

        /** ScanRecord signature */
        signature?: (Uint8Array|null);

        /** ScanRecord previousSignature */
        previousSignature?: (Uint8Array|null);

        /** ScanRecord canonicalString */
        canonicalString?: (string|null);

        /** ScanRecord payload */
        payload?: (lukuid.IScanPayload|null);

        /** ScanRecord device */
        device?: (lukuid.IDeviceInfo|null);

        /** ScanRecord manufacturer */
        manufacturer?: (lukuid.IManufacturerInfo|null);

        /** ScanRecord attachments */
        attachments?: (lukuid.IAttachment[]|null);

        /** ScanRecord identity */
        identity?: (lukuid.IIdentity|null);

        /** ScanRecord alg */
        alg?: (string|null);
    }

    /** Represents a ScanRecord. */
    class ScanRecord implements IScanRecord {

        /**
         * Constructs a new ScanRecord.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IScanRecord);

        /** ScanRecord version. */
        public version: string;

        /** ScanRecord scanId. */
        public scanId: string;

        /** ScanRecord signature. */
        public signature: Uint8Array;

        /** ScanRecord previousSignature. */
        public previousSignature: Uint8Array;

        /** ScanRecord canonicalString. */
        public canonicalString: string;

        /** ScanRecord payload. */
        public payload?: (lukuid.IScanPayload|null);

        /** ScanRecord device. */
        public device?: (lukuid.IDeviceInfo|null);

        /** ScanRecord manufacturer. */
        public manufacturer?: (lukuid.IManufacturerInfo|null);

        /** ScanRecord attachments. */
        public attachments: lukuid.IAttachment[];

        /** ScanRecord identity. */
        public identity?: (lukuid.IIdentity|null);

        /** ScanRecord alg. */
        public alg: string;

        /**
         * Creates a new ScanRecord instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ScanRecord instance
         */
        public static create(properties?: lukuid.IScanRecord): lukuid.ScanRecord;

        /**
         * Encodes the specified ScanRecord message. Does not implicitly {@link lukuid.ScanRecord.verify|verify} messages.
         * @param message ScanRecord message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IScanRecord, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ScanRecord message, length delimited. Does not implicitly {@link lukuid.ScanRecord.verify|verify} messages.
         * @param message ScanRecord message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IScanRecord, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ScanRecord message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ScanRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.ScanRecord;

        /**
         * Decodes a ScanRecord message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ScanRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.ScanRecord;

        /**
         * Verifies a ScanRecord message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ScanRecord message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ScanRecord
         */
        public static fromObject(object: { [k: string]: any }): lukuid.ScanRecord;

        /**
         * Creates a plain object from a ScanRecord message. Also converts values to other types if specified.
         * @param message ScanRecord
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.ScanRecord, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ScanRecord to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ScanRecord
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an EnvironmentPayload. */
    interface IEnvironmentPayload {

        /** EnvironmentPayload ctr */
        ctr?: (number|Long|null);

        /** EnvironmentPayload timestampUtc */
        timestampUtc?: (number|Long|null);

        /** EnvironmentPayload uptimeUs */
        uptimeUs?: (number|Long|null);

        /** EnvironmentPayload nonce */
        nonce?: (string|null);

        /** EnvironmentPayload firmware */
        firmware?: (string|null);

        /** EnvironmentPayload lux */
        lux?: (number|null);

        /** EnvironmentPayload tempC */
        tempC?: (number|null);

        /** EnvironmentPayload humidityPct */
        humidityPct?: (number|null);

        /** EnvironmentPayload pressureHpa */
        pressureHpa?: (number|null);

        /** EnvironmentPayload vocIndex */
        vocIndex?: (number|null);

        /** EnvironmentPayload accelG */
        accelG?: (lukuid.EnvironmentPayload.IAccel|null);

        /** EnvironmentPayload tamper */
        tamper?: (boolean|null);

        /** EnvironmentPayload wakeEvent */
        wakeEvent?: (boolean|null);

        /** EnvironmentPayload vbusPresent */
        vbusPresent?: (boolean|null);

        /** EnvironmentPayload genesisHash */
        genesisHash?: (string|null);
    }

    /** Represents an EnvironmentPayload. */
    class EnvironmentPayload implements IEnvironmentPayload {

        /**
         * Constructs a new EnvironmentPayload.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IEnvironmentPayload);

        /** EnvironmentPayload ctr. */
        public ctr: (number|Long);

        /** EnvironmentPayload timestampUtc. */
        public timestampUtc: (number|Long);

        /** EnvironmentPayload uptimeUs. */
        public uptimeUs: (number|Long);

        /** EnvironmentPayload nonce. */
        public nonce: string;

        /** EnvironmentPayload firmware. */
        public firmware: string;

        /** EnvironmentPayload lux. */
        public lux: number;

        /** EnvironmentPayload tempC. */
        public tempC: number;

        /** EnvironmentPayload humidityPct. */
        public humidityPct: number;

        /** EnvironmentPayload pressureHpa. */
        public pressureHpa: number;

        /** EnvironmentPayload vocIndex. */
        public vocIndex: number;

        /** EnvironmentPayload accelG. */
        public accelG?: (lukuid.EnvironmentPayload.IAccel|null);

        /** EnvironmentPayload tamper. */
        public tamper: boolean;

        /** EnvironmentPayload wakeEvent. */
        public wakeEvent: boolean;

        /** EnvironmentPayload vbusPresent. */
        public vbusPresent: boolean;

        /** EnvironmentPayload genesisHash. */
        public genesisHash: string;

        /**
         * Creates a new EnvironmentPayload instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EnvironmentPayload instance
         */
        public static create(properties?: lukuid.IEnvironmentPayload): lukuid.EnvironmentPayload;

        /**
         * Encodes the specified EnvironmentPayload message. Does not implicitly {@link lukuid.EnvironmentPayload.verify|verify} messages.
         * @param message EnvironmentPayload message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IEnvironmentPayload, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EnvironmentPayload message, length delimited. Does not implicitly {@link lukuid.EnvironmentPayload.verify|verify} messages.
         * @param message EnvironmentPayload message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IEnvironmentPayload, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EnvironmentPayload message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EnvironmentPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.EnvironmentPayload;

        /**
         * Decodes an EnvironmentPayload message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EnvironmentPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.EnvironmentPayload;

        /**
         * Verifies an EnvironmentPayload message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EnvironmentPayload message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EnvironmentPayload
         */
        public static fromObject(object: { [k: string]: any }): lukuid.EnvironmentPayload;

        /**
         * Creates a plain object from an EnvironmentPayload message. Also converts values to other types if specified.
         * @param message EnvironmentPayload
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.EnvironmentPayload, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EnvironmentPayload to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for EnvironmentPayload
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace EnvironmentPayload {

        /** Properties of an Accel. */
        interface IAccel {

            /** Accel x */
            x?: (number|null);

            /** Accel y */
            y?: (number|null);

            /** Accel z */
            z?: (number|null);
        }

        /** Represents an Accel. */
        class Accel implements IAccel {

            /**
             * Constructs a new Accel.
             * @param [properties] Properties to set
             */
            constructor(properties?: lukuid.EnvironmentPayload.IAccel);

            /** Accel x. */
            public x: number;

            /** Accel y. */
            public y: number;

            /** Accel z. */
            public z: number;

            /**
             * Creates a new Accel instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Accel instance
             */
            public static create(properties?: lukuid.EnvironmentPayload.IAccel): lukuid.EnvironmentPayload.Accel;

            /**
             * Encodes the specified Accel message. Does not implicitly {@link lukuid.EnvironmentPayload.Accel.verify|verify} messages.
             * @param message Accel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: lukuid.EnvironmentPayload.IAccel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Accel message, length delimited. Does not implicitly {@link lukuid.EnvironmentPayload.Accel.verify|verify} messages.
             * @param message Accel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: lukuid.EnvironmentPayload.IAccel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Accel message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Accel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.EnvironmentPayload.Accel;

            /**
             * Decodes an Accel message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Accel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.EnvironmentPayload.Accel;

            /**
             * Verifies an Accel message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Accel message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Accel
             */
            public static fromObject(object: { [k: string]: any }): lukuid.EnvironmentPayload.Accel;

            /**
             * Creates a plain object from an Accel message. Also converts values to other types if specified.
             * @param message Accel
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: lukuid.EnvironmentPayload.Accel, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Accel to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Accel
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }

    /** Properties of an EnvironmentRecord. */
    interface IEnvironmentRecord {

        /** EnvironmentRecord version */
        version?: (string|null);

        /** EnvironmentRecord eventId */
        eventId?: (string|null);

        /** EnvironmentRecord signature */
        signature?: (Uint8Array|null);

        /** EnvironmentRecord previousSignature */
        previousSignature?: (Uint8Array|null);

        /** EnvironmentRecord canonicalString */
        canonicalString?: (string|null);

        /** EnvironmentRecord payload */
        payload?: (lukuid.IEnvironmentPayload|null);

        /** EnvironmentRecord device */
        device?: (lukuid.IDeviceInfo|null);

        /** EnvironmentRecord attachments */
        attachments?: (lukuid.IAttachment[]|null);

        /** EnvironmentRecord identity */
        identity?: (lukuid.IIdentity|null);

        /** EnvironmentRecord alg */
        alg?: (string|null);
    }

    /** Represents an EnvironmentRecord. */
    class EnvironmentRecord implements IEnvironmentRecord {

        /**
         * Constructs a new EnvironmentRecord.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IEnvironmentRecord);

        /** EnvironmentRecord version. */
        public version: string;

        /** EnvironmentRecord eventId. */
        public eventId: string;

        /** EnvironmentRecord signature. */
        public signature: Uint8Array;

        /** EnvironmentRecord previousSignature. */
        public previousSignature: Uint8Array;

        /** EnvironmentRecord canonicalString. */
        public canonicalString: string;

        /** EnvironmentRecord payload. */
        public payload?: (lukuid.IEnvironmentPayload|null);

        /** EnvironmentRecord device. */
        public device?: (lukuid.IDeviceInfo|null);

        /** EnvironmentRecord attachments. */
        public attachments: lukuid.IAttachment[];

        /** EnvironmentRecord identity. */
        public identity?: (lukuid.IIdentity|null);

        /** EnvironmentRecord alg. */
        public alg: string;

        /**
         * Creates a new EnvironmentRecord instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EnvironmentRecord instance
         */
        public static create(properties?: lukuid.IEnvironmentRecord): lukuid.EnvironmentRecord;

        /**
         * Encodes the specified EnvironmentRecord message. Does not implicitly {@link lukuid.EnvironmentRecord.verify|verify} messages.
         * @param message EnvironmentRecord message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IEnvironmentRecord, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EnvironmentRecord message, length delimited. Does not implicitly {@link lukuid.EnvironmentRecord.verify|verify} messages.
         * @param message EnvironmentRecord message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IEnvironmentRecord, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EnvironmentRecord message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EnvironmentRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.EnvironmentRecord;

        /**
         * Decodes an EnvironmentRecord message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EnvironmentRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.EnvironmentRecord;

        /**
         * Verifies an EnvironmentRecord message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EnvironmentRecord message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EnvironmentRecord
         */
        public static fromObject(object: { [k: string]: any }): lukuid.EnvironmentRecord;

        /**
         * Creates a plain object from an EnvironmentRecord message. Also converts values to other types if specified.
         * @param message EnvironmentRecord
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.EnvironmentRecord, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EnvironmentRecord to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for EnvironmentRecord
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RecordBatch. */
    interface IRecordBatch {

        /** RecordBatch attestationDacDer */
        attestationDacDer?: (Uint8Array|null);

        /** RecordBatch attestationManufacturerDer */
        attestationManufacturerDer?: (Uint8Array|null);

        /** RecordBatch attestationIntermediateDer */
        attestationIntermediateDer?: (Uint8Array|null);

        /** RecordBatch heartbeatSlacDer */
        heartbeatSlacDer?: (Uint8Array|null);

        /** RecordBatch heartbeatDer */
        heartbeatDer?: (Uint8Array|null);

        /** RecordBatch heartbeatIntermediateDer */
        heartbeatIntermediateDer?: (Uint8Array|null);

        /** RecordBatch device */
        device?: (lukuid.IDeviceInfo|null);

        /** RecordBatch environmentRecords */
        environmentRecords?: (lukuid.IEnvironmentRecord[]|null);

        /** RecordBatch scanRecords */
        scanRecords?: (lukuid.IScanRecord[]|null);

        /** RecordBatch attachmentRecords */
        attachmentRecords?: (lukuid.IAttachmentRecord[]|null);

        /** RecordBatch attestationRootFingerprint */
        attestationRootFingerprint?: (string|null);

        /** RecordBatch heartbeatRootFingerprint */
        heartbeatRootFingerprint?: (string|null);
    }

    /** Represents a RecordBatch. */
    class RecordBatch implements IRecordBatch {

        /**
         * Constructs a new RecordBatch.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IRecordBatch);

        /** RecordBatch attestationDacDer. */
        public attestationDacDer: Uint8Array;

        /** RecordBatch attestationManufacturerDer. */
        public attestationManufacturerDer: Uint8Array;

        /** RecordBatch attestationIntermediateDer. */
        public attestationIntermediateDer: Uint8Array;

        /** RecordBatch heartbeatSlacDer. */
        public heartbeatSlacDer: Uint8Array;

        /** RecordBatch heartbeatDer. */
        public heartbeatDer: Uint8Array;

        /** RecordBatch heartbeatIntermediateDer. */
        public heartbeatIntermediateDer: Uint8Array;

        /** RecordBatch device. */
        public device?: (lukuid.IDeviceInfo|null);

        /** RecordBatch environmentRecords. */
        public environmentRecords: lukuid.IEnvironmentRecord[];

        /** RecordBatch scanRecords. */
        public scanRecords: lukuid.IScanRecord[];

        /** RecordBatch attachmentRecords. */
        public attachmentRecords: lukuid.IAttachmentRecord[];

        /** RecordBatch attestationRootFingerprint. */
        public attestationRootFingerprint: string;

        /** RecordBatch heartbeatRootFingerprint. */
        public heartbeatRootFingerprint: string;

        /**
         * Creates a new RecordBatch instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RecordBatch instance
         */
        public static create(properties?: lukuid.IRecordBatch): lukuid.RecordBatch;

        /**
         * Encodes the specified RecordBatch message. Does not implicitly {@link lukuid.RecordBatch.verify|verify} messages.
         * @param message RecordBatch message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IRecordBatch, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RecordBatch message, length delimited. Does not implicitly {@link lukuid.RecordBatch.verify|verify} messages.
         * @param message RecordBatch message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IRecordBatch, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RecordBatch message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RecordBatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.RecordBatch;

        /**
         * Decodes a RecordBatch message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RecordBatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.RecordBatch;

        /**
         * Verifies a RecordBatch message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RecordBatch message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RecordBatch
         */
        public static fromObject(object: { [k: string]: any }): lukuid.RecordBatch;

        /**
         * Creates a plain object from a RecordBatch message. Also converts values to other types if specified.
         * @param message RecordBatch
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.RecordBatch, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RecordBatch to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for RecordBatch
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RecordBatches. */
    interface IRecordBatches {

        /** RecordBatches batches */
        batches?: (lukuid.IRecordBatch[]|null);
    }

    /** Represents a RecordBatches. */
    class RecordBatches implements IRecordBatches {

        /**
         * Constructs a new RecordBatches.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IRecordBatches);

        /** RecordBatches batches. */
        public batches: lukuid.IRecordBatch[];

        /**
         * Creates a new RecordBatches instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RecordBatches instance
         */
        public static create(properties?: lukuid.IRecordBatches): lukuid.RecordBatches;

        /**
         * Encodes the specified RecordBatches message. Does not implicitly {@link lukuid.RecordBatches.verify|verify} messages.
         * @param message RecordBatches message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IRecordBatches, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RecordBatches message, length delimited. Does not implicitly {@link lukuid.RecordBatches.verify|verify} messages.
         * @param message RecordBatches message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IRecordBatches, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RecordBatches message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RecordBatches
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.RecordBatches;

        /**
         * Decodes a RecordBatches message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RecordBatches
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.RecordBatches;

        /**
         * Verifies a RecordBatches message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RecordBatches message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RecordBatches
         */
        public static fromObject(object: { [k: string]: any }): lukuid.RecordBatches;

        /**
         * Creates a plain object from a RecordBatches message. Also converts values to other types if specified.
         * @param message RecordBatches
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.RecordBatches, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RecordBatches to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for RecordBatches
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a FullRecordResponse. */
    interface IFullRecordResponse {

        /** FullRecordResponse recordId */
        recordId?: (string|null);

        /** FullRecordResponse scanFull */
        scanFull?: (lukuid.IScanRecord|null);

        /** FullRecordResponse environmentFull */
        environmentFull?: (lukuid.IEnvironmentRecord|null);
    }

    /** Represents a FullRecordResponse. */
    class FullRecordResponse implements IFullRecordResponse {

        /**
         * Constructs a new FullRecordResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IFullRecordResponse);

        /** FullRecordResponse recordId. */
        public recordId: string;

        /** FullRecordResponse scanFull. */
        public scanFull?: (lukuid.IScanRecord|null);

        /** FullRecordResponse environmentFull. */
        public environmentFull?: (lukuid.IEnvironmentRecord|null);

        /** FullRecordResponse fullRecord. */
        public fullRecord?: ("scanFull"|"environmentFull");

        /**
         * Creates a new FullRecordResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FullRecordResponse instance
         */
        public static create(properties?: lukuid.IFullRecordResponse): lukuid.FullRecordResponse;

        /**
         * Encodes the specified FullRecordResponse message. Does not implicitly {@link lukuid.FullRecordResponse.verify|verify} messages.
         * @param message FullRecordResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IFullRecordResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FullRecordResponse message, length delimited. Does not implicitly {@link lukuid.FullRecordResponse.verify|verify} messages.
         * @param message FullRecordResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IFullRecordResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FullRecordResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FullRecordResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.FullRecordResponse;

        /**
         * Decodes a FullRecordResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FullRecordResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.FullRecordResponse;

        /**
         * Verifies a FullRecordResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FullRecordResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FullRecordResponse
         */
        public static fromObject(object: { [k: string]: any }): lukuid.FullRecordResponse;

        /**
         * Creates a plain object from a FullRecordResponse message. Also converts values to other types if specified.
         * @param message FullRecordResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.FullRecordResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FullRecordResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for FullRecordResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a HeartbeatInitResponse. */
    interface IHeartbeatInitResponse {

        /** HeartbeatInitResponse signatureB64 */
        signatureB64?: (string|null);

        /** HeartbeatInitResponse csrPem */
        csrPem?: (string|null);

        /** HeartbeatInitResponse attestationB64 */
        attestationB64?: (string|null);

        /** HeartbeatInitResponse counter */
        counter?: (number|Long|null);

        /** HeartbeatInitResponse lastSyncBucket */
        lastSyncBucket?: (number|Long|null);

        /** HeartbeatInitResponse latestTimestamp */
        latestTimestamp?: (number|Long|null);

        /** HeartbeatInitResponse currentTimestamp */
        currentTimestamp?: (number|Long|null);

        /** HeartbeatInitResponse lastIntermediateSerial */
        lastIntermediateSerial?: (string|null);

        /** HeartbeatInitResponse lastSlacSerial */
        lastSlacSerial?: (string|null);
    }

    /** Represents a HeartbeatInitResponse. */
    class HeartbeatInitResponse implements IHeartbeatInitResponse {

        /**
         * Constructs a new HeartbeatInitResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.IHeartbeatInitResponse);

        /** HeartbeatInitResponse signatureB64. */
        public signatureB64: string;

        /** HeartbeatInitResponse csrPem. */
        public csrPem: string;

        /** HeartbeatInitResponse attestationB64. */
        public attestationB64: string;

        /** HeartbeatInitResponse counter. */
        public counter: (number|Long);

        /** HeartbeatInitResponse lastSyncBucket. */
        public lastSyncBucket: (number|Long);

        /** HeartbeatInitResponse latestTimestamp. */
        public latestTimestamp: (number|Long);

        /** HeartbeatInitResponse currentTimestamp. */
        public currentTimestamp: (number|Long);

        /** HeartbeatInitResponse lastIntermediateSerial. */
        public lastIntermediateSerial: string;

        /** HeartbeatInitResponse lastSlacSerial. */
        public lastSlacSerial: string;

        /**
         * Creates a new HeartbeatInitResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns HeartbeatInitResponse instance
         */
        public static create(properties?: lukuid.IHeartbeatInitResponse): lukuid.HeartbeatInitResponse;

        /**
         * Encodes the specified HeartbeatInitResponse message. Does not implicitly {@link lukuid.HeartbeatInitResponse.verify|verify} messages.
         * @param message HeartbeatInitResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.IHeartbeatInitResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified HeartbeatInitResponse message, length delimited. Does not implicitly {@link lukuid.HeartbeatInitResponse.verify|verify} messages.
         * @param message HeartbeatInitResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.IHeartbeatInitResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a HeartbeatInitResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns HeartbeatInitResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.HeartbeatInitResponse;

        /**
         * Decodes a HeartbeatInitResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns HeartbeatInitResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.HeartbeatInitResponse;

        /**
         * Verifies a HeartbeatInitResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a HeartbeatInitResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns HeartbeatInitResponse
         */
        public static fromObject(object: { [k: string]: any }): lukuid.HeartbeatInitResponse;

        /**
         * Creates a plain object from a HeartbeatInitResponse message. Also converts values to other types if specified.
         * @param message HeartbeatInitResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.HeartbeatInitResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this HeartbeatInitResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for HeartbeatInitResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a CommandResponse. */
    interface ICommandResponse {

        /** CommandResponse action */
        action?: (string|null);

        /** CommandResponse status */
        status?: (lukuid.Status|null);

        /** CommandResponse success */
        success?: (boolean|null);

        /** CommandResponse errorCode */
        errorCode?: (string|null);

        /** CommandResponse message */
        message?: (string|null);

        /** CommandResponse deviceInfo */
        deviceInfo?: (lukuid.IDeviceInfoResponse|null);

        /** CommandResponse networkConfig */
        networkConfig?: (lukuid.INetworkConfigResponse|null);

        /** CommandResponse scanRecord */
        scanRecord?: (lukuid.IScanRecord|null);

        /** CommandResponse envRecord */
        envRecord?: (lukuid.IEnvironmentRecord|null);

        /** CommandResponse fetchResponse */
        fetchResponse?: (lukuid.IFetchResponse|null);

        /** CommandResponse fullRecordResponse */
        fullRecordResponse?: (lukuid.IFullRecordResponse|null);

        /** CommandResponse recordBatches */
        recordBatches?: (lukuid.IRecordBatches|null);

        /** CommandResponse heartbeatInit */
        heartbeatInit?: (lukuid.IHeartbeatInitResponse|null);

        /** CommandResponse statusResponse */
        statusResponse?: (lukuid.IStatusResponse|null);

        /** CommandResponse fetchTelemetry */
        fetchTelemetry?: (lukuid.IFetchTelemetryResponse|null);

        /** CommandResponse signature */
        signature?: (Uint8Array|null);

        /** CommandResponse key */
        key?: (Uint8Array|null);

        /** CommandResponse hasMore */
        hasMore?: (boolean|null);
    }

    /** Represents a CommandResponse. */
    class CommandResponse implements ICommandResponse {

        /**
         * Constructs a new CommandResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: lukuid.ICommandResponse);

        /** CommandResponse action. */
        public action: string;

        /** CommandResponse status. */
        public status: lukuid.Status;

        /** CommandResponse success. */
        public success: boolean;

        /** CommandResponse errorCode. */
        public errorCode: string;

        /** CommandResponse message. */
        public message: string;

        /** CommandResponse deviceInfo. */
        public deviceInfo?: (lukuid.IDeviceInfoResponse|null);

        /** CommandResponse networkConfig. */
        public networkConfig?: (lukuid.INetworkConfigResponse|null);

        /** CommandResponse scanRecord. */
        public scanRecord?: (lukuid.IScanRecord|null);

        /** CommandResponse envRecord. */
        public envRecord?: (lukuid.IEnvironmentRecord|null);

        /** CommandResponse fetchResponse. */
        public fetchResponse?: (lukuid.IFetchResponse|null);

        /** CommandResponse fullRecordResponse. */
        public fullRecordResponse?: (lukuid.IFullRecordResponse|null);

        /** CommandResponse recordBatches. */
        public recordBatches?: (lukuid.IRecordBatches|null);

        /** CommandResponse heartbeatInit. */
        public heartbeatInit?: (lukuid.IHeartbeatInitResponse|null);

        /** CommandResponse statusResponse. */
        public statusResponse?: (lukuid.IStatusResponse|null);

        /** CommandResponse fetchTelemetry. */
        public fetchTelemetry?: (lukuid.IFetchTelemetryResponse|null);

        /** CommandResponse signature. */
        public signature?: (Uint8Array|null);

        /** CommandResponse key. */
        public key?: (Uint8Array|null);

        /** CommandResponse hasMore. */
        public hasMore?: (boolean|null);

        /** CommandResponse payload. */
        public payload?: ("deviceInfo"|"networkConfig"|"scanRecord"|"envRecord"|"fetchResponse"|"fullRecordResponse"|"recordBatches"|"heartbeatInit"|"statusResponse"|"fetchTelemetry");

        /**
         * Creates a new CommandResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns CommandResponse instance
         */
        public static create(properties?: lukuid.ICommandResponse): lukuid.CommandResponse;

        /**
         * Encodes the specified CommandResponse message. Does not implicitly {@link lukuid.CommandResponse.verify|verify} messages.
         * @param message CommandResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: lukuid.ICommandResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified CommandResponse message, length delimited. Does not implicitly {@link lukuid.CommandResponse.verify|verify} messages.
         * @param message CommandResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: lukuid.ICommandResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a CommandResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns CommandResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): lukuid.CommandResponse;

        /**
         * Decodes a CommandResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns CommandResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): lukuid.CommandResponse;

        /**
         * Verifies a CommandResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a CommandResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns CommandResponse
         */
        public static fromObject(object: { [k: string]: any }): lukuid.CommandResponse;

        /**
         * Creates a plain object from a CommandResponse message. Also converts values to other types if specified.
         * @param message CommandResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: lukuid.CommandResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this CommandResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for CommandResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}
