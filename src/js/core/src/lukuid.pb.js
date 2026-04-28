// SPDX-License-Identifier: Apache-2.0
/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const lukuid = $root.lukuid = (() => {

    /**
     * Namespace lukuid.
     * @exports lukuid
     * @namespace
     */
    const lukuid = {};

    /**
     * Status enum.
     * @name lukuid.Status
     * @enum {number}
     * @property {number} STATUS_UNKNOWN=0 STATUS_UNKNOWN value
     * @property {number} STATUS_OK=1 STATUS_OK value
     * @property {number} STATUS_ERROR=2 STATUS_ERROR value
     * @property {number} STATUS_READY=3 STATUS_READY value
     */
    lukuid.Status = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "STATUS_UNKNOWN"] = 0;
        values[valuesById[1] = "STATUS_OK"] = 1;
        values[valuesById[2] = "STATUS_ERROR"] = 2;
        values[valuesById[3] = "STATUS_READY"] = 3;
        return values;
    })();

    /**
     * FetchWindow enum.
     * @name lukuid.FetchWindow
     * @enum {number}
     * @property {number} FETCH_WINDOW_NONE=0 FETCH_WINDOW_NONE value
     * @property {number} FETCH_WINDOW_HOURLY=1 FETCH_WINDOW_HOURLY value
     * @property {number} FETCH_WINDOW_DAILY=2 FETCH_WINDOW_DAILY value
     * @property {number} FETCH_WINDOW_WEEKLY=3 FETCH_WINDOW_WEEKLY value
     * @property {number} FETCH_WINDOW_MONTHLY=4 FETCH_WINDOW_MONTHLY value
     */
    lukuid.FetchWindow = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "FETCH_WINDOW_NONE"] = 0;
        values[valuesById[1] = "FETCH_WINDOW_HOURLY"] = 1;
        values[valuesById[2] = "FETCH_WINDOW_DAILY"] = 2;
        values[valuesById[3] = "FETCH_WINDOW_WEEKLY"] = 3;
        values[valuesById[4] = "FETCH_WINDOW_MONTHLY"] = 4;
        return values;
    })();

    lukuid.MetricStats = (function() {

        /**
         * Properties of a MetricStats.
         * @memberof lukuid
         * @interface IMetricStats
         * @property {number|null} [avg] MetricStats avg
         * @property {number|null} [min] MetricStats min
         * @property {number|null} [max] MetricStats max
         * @property {number|null} [variance] MetricStats variance
         * @property {number|null} [count] MetricStats count
         */

        /**
         * Constructs a new MetricStats.
         * @memberof lukuid
         * @classdesc Represents a MetricStats.
         * @implements IMetricStats
         * @constructor
         * @param {lukuid.IMetricStats=} [properties] Properties to set
         */
        function MetricStats(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * MetricStats avg.
         * @member {number} avg
         * @memberof lukuid.MetricStats
         * @instance
         */
        MetricStats.prototype.avg = 0;

        /**
         * MetricStats min.
         * @member {number} min
         * @memberof lukuid.MetricStats
         * @instance
         */
        MetricStats.prototype.min = 0;

        /**
         * MetricStats max.
         * @member {number} max
         * @memberof lukuid.MetricStats
         * @instance
         */
        MetricStats.prototype.max = 0;

        /**
         * MetricStats variance.
         * @member {number} variance
         * @memberof lukuid.MetricStats
         * @instance
         */
        MetricStats.prototype.variance = 0;

        /**
         * MetricStats count.
         * @member {number} count
         * @memberof lukuid.MetricStats
         * @instance
         */
        MetricStats.prototype.count = 0;

        /**
         * Creates a new MetricStats instance using the specified properties.
         * @function create
         * @memberof lukuid.MetricStats
         * @static
         * @param {lukuid.IMetricStats=} [properties] Properties to set
         * @returns {lukuid.MetricStats} MetricStats instance
         */
        MetricStats.create = function create(properties) {
            return new MetricStats(properties);
        };

        /**
         * Encodes the specified MetricStats message. Does not implicitly {@link lukuid.MetricStats.verify|verify} messages.
         * @function encode
         * @memberof lukuid.MetricStats
         * @static
         * @param {lukuid.IMetricStats} message MetricStats message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        MetricStats.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.avg != null && Object.hasOwnProperty.call(message, "avg"))
                writer.uint32(/* id 1, wireType 5 =*/13).float(message.avg);
            if (message.min != null && Object.hasOwnProperty.call(message, "min"))
                writer.uint32(/* id 2, wireType 5 =*/21).float(message.min);
            if (message.max != null && Object.hasOwnProperty.call(message, "max"))
                writer.uint32(/* id 3, wireType 5 =*/29).float(message.max);
            if (message.variance != null && Object.hasOwnProperty.call(message, "variance"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.variance);
            if (message.count != null && Object.hasOwnProperty.call(message, "count"))
                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.count);
            return writer;
        };

        /**
         * Encodes the specified MetricStats message, length delimited. Does not implicitly {@link lukuid.MetricStats.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.MetricStats
         * @static
         * @param {lukuid.IMetricStats} message MetricStats message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        MetricStats.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a MetricStats message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.MetricStats
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.MetricStats} MetricStats
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        MetricStats.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.MetricStats();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.avg = reader.float();
                        break;
                    }
                case 2: {
                        message.min = reader.float();
                        break;
                    }
                case 3: {
                        message.max = reader.float();
                        break;
                    }
                case 4: {
                        message.variance = reader.float();
                        break;
                    }
                case 5: {
                        message.count = reader.uint32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a MetricStats message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.MetricStats
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.MetricStats} MetricStats
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        MetricStats.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a MetricStats message.
         * @function verify
         * @memberof lukuid.MetricStats
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        MetricStats.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.avg != null && message.hasOwnProperty("avg"))
                if (typeof message.avg !== "number")
                    return "avg: number expected";
            if (message.min != null && message.hasOwnProperty("min"))
                if (typeof message.min !== "number")
                    return "min: number expected";
            if (message.max != null && message.hasOwnProperty("max"))
                if (typeof message.max !== "number")
                    return "max: number expected";
            if (message.variance != null && message.hasOwnProperty("variance"))
                if (typeof message.variance !== "number")
                    return "variance: number expected";
            if (message.count != null && message.hasOwnProperty("count"))
                if (!$util.isInteger(message.count))
                    return "count: integer expected";
            return null;
        };

        /**
         * Creates a MetricStats message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.MetricStats
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.MetricStats} MetricStats
         */
        MetricStats.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.MetricStats)
                return object;
            let message = new $root.lukuid.MetricStats();
            if (object.avg != null)
                message.avg = Number(object.avg);
            if (object.min != null)
                message.min = Number(object.min);
            if (object.max != null)
                message.max = Number(object.max);
            if (object.variance != null)
                message.variance = Number(object.variance);
            if (object.count != null)
                message.count = object.count >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a MetricStats message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.MetricStats
         * @static
         * @param {lukuid.MetricStats} message MetricStats
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        MetricStats.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.avg = 0;
                object.min = 0;
                object.max = 0;
                object.variance = 0;
                object.count = 0;
            }
            if (message.avg != null && message.hasOwnProperty("avg"))
                object.avg = options.json && !isFinite(message.avg) ? String(message.avg) : message.avg;
            if (message.min != null && message.hasOwnProperty("min"))
                object.min = options.json && !isFinite(message.min) ? String(message.min) : message.min;
            if (message.max != null && message.hasOwnProperty("max"))
                object.max = options.json && !isFinite(message.max) ? String(message.max) : message.max;
            if (message.variance != null && message.hasOwnProperty("variance"))
                object.variance = options.json && !isFinite(message.variance) ? String(message.variance) : message.variance;
            if (message.count != null && message.hasOwnProperty("count"))
                object.count = message.count;
            return object;
        };

        /**
         * Converts this MetricStats to JSON.
         * @function toJSON
         * @memberof lukuid.MetricStats
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        MetricStats.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for MetricStats
         * @function getTypeUrl
         * @memberof lukuid.MetricStats
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        MetricStats.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.MetricStats";
        };

        return MetricStats;
    })();

    lukuid.MetricValue = (function() {

        /**
         * Properties of a MetricValue.
         * @memberof lukuid
         * @interface IMetricValue
         * @property {number|null} [value] MetricValue value
         * @property {lukuid.IMetricStats|null} [stats] MetricValue stats
         */

        /**
         * Constructs a new MetricValue.
         * @memberof lukuid
         * @classdesc Represents a MetricValue.
         * @implements IMetricValue
         * @constructor
         * @param {lukuid.IMetricValue=} [properties] Properties to set
         */
        function MetricValue(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * MetricValue value.
         * @member {number|null|undefined} value
         * @memberof lukuid.MetricValue
         * @instance
         */
        MetricValue.prototype.value = null;

        /**
         * MetricValue stats.
         * @member {lukuid.IMetricStats|null|undefined} stats
         * @memberof lukuid.MetricValue
         * @instance
         */
        MetricValue.prototype.stats = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * MetricValue kind.
         * @member {"value"|"stats"|undefined} kind
         * @memberof lukuid.MetricValue
         * @instance
         */
        Object.defineProperty(MetricValue.prototype, "kind", {
            get: $util.oneOfGetter($oneOfFields = ["value", "stats"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new MetricValue instance using the specified properties.
         * @function create
         * @memberof lukuid.MetricValue
         * @static
         * @param {lukuid.IMetricValue=} [properties] Properties to set
         * @returns {lukuid.MetricValue} MetricValue instance
         */
        MetricValue.create = function create(properties) {
            return new MetricValue(properties);
        };

        /**
         * Encodes the specified MetricValue message. Does not implicitly {@link lukuid.MetricValue.verify|verify} messages.
         * @function encode
         * @memberof lukuid.MetricValue
         * @static
         * @param {lukuid.IMetricValue} message MetricValue message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        MetricValue.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                writer.uint32(/* id 1, wireType 5 =*/13).float(message.value);
            if (message.stats != null && Object.hasOwnProperty.call(message, "stats"))
                $root.lukuid.MetricStats.encode(message.stats, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified MetricValue message, length delimited. Does not implicitly {@link lukuid.MetricValue.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.MetricValue
         * @static
         * @param {lukuid.IMetricValue} message MetricValue message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        MetricValue.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a MetricValue message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.MetricValue
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.MetricValue} MetricValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        MetricValue.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.MetricValue();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.value = reader.float();
                        break;
                    }
                case 2: {
                        message.stats = $root.lukuid.MetricStats.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a MetricValue message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.MetricValue
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.MetricValue} MetricValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        MetricValue.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a MetricValue message.
         * @function verify
         * @memberof lukuid.MetricValue
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        MetricValue.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.value != null && message.hasOwnProperty("value")) {
                properties.kind = 1;
                if (typeof message.value !== "number")
                    return "value: number expected";
            }
            if (message.stats != null && message.hasOwnProperty("stats")) {
                if (properties.kind === 1)
                    return "kind: multiple values";
                properties.kind = 1;
                {
                    let error = $root.lukuid.MetricStats.verify(message.stats);
                    if (error)
                        return "stats." + error;
                }
            }
            return null;
        };

        /**
         * Creates a MetricValue message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.MetricValue
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.MetricValue} MetricValue
         */
        MetricValue.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.MetricValue)
                return object;
            let message = new $root.lukuid.MetricValue();
            if (object.value != null)
                message.value = Number(object.value);
            if (object.stats != null) {
                if (typeof object.stats !== "object")
                    throw TypeError(".lukuid.MetricValue.stats: object expected");
                message.stats = $root.lukuid.MetricStats.fromObject(object.stats);
            }
            return message;
        };

        /**
         * Creates a plain object from a MetricValue message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.MetricValue
         * @static
         * @param {lukuid.MetricValue} message MetricValue
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        MetricValue.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (message.value != null && message.hasOwnProperty("value")) {
                object.value = options.json && !isFinite(message.value) ? String(message.value) : message.value;
                if (options.oneofs)
                    object.kind = "value";
            }
            if (message.stats != null && message.hasOwnProperty("stats")) {
                object.stats = $root.lukuid.MetricStats.toObject(message.stats, options);
                if (options.oneofs)
                    object.kind = "stats";
            }
            return object;
        };

        /**
         * Converts this MetricValue to JSON.
         * @function toJSON
         * @memberof lukuid.MetricValue
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        MetricValue.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for MetricValue
         * @function getTypeUrl
         * @memberof lukuid.MetricValue
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        MetricValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.MetricValue";
        };

        return MetricValue;
    })();

    lukuid.FetchRequest = (function() {

        /**
         * Properties of a FetchRequest.
         * @memberof lukuid
         * @interface IFetchRequest
         * @property {string|null} [query] FetchRequest query
         * @property {number|null} [offset] FetchRequest offset
         * @property {number|null} [limit] FetchRequest limit
         * @property {boolean|null} [fetchFull] FetchRequest fetchFull
         * @property {number|Long|null} [starts] FetchRequest starts
         * @property {number|Long|null} [ends] FetchRequest ends
         * @property {lukuid.FetchWindow|null} [window] FetchRequest window
         */

        /**
         * Constructs a new FetchRequest.
         * @memberof lukuid
         * @classdesc Represents a FetchRequest.
         * @implements IFetchRequest
         * @constructor
         * @param {lukuid.IFetchRequest=} [properties] Properties to set
         */
        function FetchRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * FetchRequest query.
         * @member {string} query
         * @memberof lukuid.FetchRequest
         * @instance
         */
        FetchRequest.prototype.query = "";

        /**
         * FetchRequest offset.
         * @member {number} offset
         * @memberof lukuid.FetchRequest
         * @instance
         */
        FetchRequest.prototype.offset = 0;

        /**
         * FetchRequest limit.
         * @member {number} limit
         * @memberof lukuid.FetchRequest
         * @instance
         */
        FetchRequest.prototype.limit = 0;

        /**
         * FetchRequest fetchFull.
         * @member {boolean} fetchFull
         * @memberof lukuid.FetchRequest
         * @instance
         */
        FetchRequest.prototype.fetchFull = false;

        /**
         * FetchRequest starts.
         * @member {number|Long} starts
         * @memberof lukuid.FetchRequest
         * @instance
         */
        FetchRequest.prototype.starts = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * FetchRequest ends.
         * @member {number|Long} ends
         * @memberof lukuid.FetchRequest
         * @instance
         */
        FetchRequest.prototype.ends = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * FetchRequest window.
         * @member {lukuid.FetchWindow} window
         * @memberof lukuid.FetchRequest
         * @instance
         */
        FetchRequest.prototype.window = 0;

        /**
         * Creates a new FetchRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.FetchRequest
         * @static
         * @param {lukuid.IFetchRequest=} [properties] Properties to set
         * @returns {lukuid.FetchRequest} FetchRequest instance
         */
        FetchRequest.create = function create(properties) {
            return new FetchRequest(properties);
        };

        /**
         * Encodes the specified FetchRequest message. Does not implicitly {@link lukuid.FetchRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.FetchRequest
         * @static
         * @param {lukuid.IFetchRequest} message FetchRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FetchRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.query != null && Object.hasOwnProperty.call(message, "query"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.query);
            if (message.offset != null && Object.hasOwnProperty.call(message, "offset"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.offset);
            if (message.limit != null && Object.hasOwnProperty.call(message, "limit"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.limit);
            if (message.fetchFull != null && Object.hasOwnProperty.call(message, "fetchFull"))
                writer.uint32(/* id 4, wireType 0 =*/32).bool(message.fetchFull);
            if (message.starts != null && Object.hasOwnProperty.call(message, "starts"))
                writer.uint32(/* id 5, wireType 0 =*/40).int64(message.starts);
            if (message.ends != null && Object.hasOwnProperty.call(message, "ends"))
                writer.uint32(/* id 6, wireType 0 =*/48).int64(message.ends);
            if (message.window != null && Object.hasOwnProperty.call(message, "window"))
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.window);
            return writer;
        };

        /**
         * Encodes the specified FetchRequest message, length delimited. Does not implicitly {@link lukuid.FetchRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.FetchRequest
         * @static
         * @param {lukuid.IFetchRequest} message FetchRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FetchRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a FetchRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.FetchRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.FetchRequest} FetchRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FetchRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.FetchRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.query = reader.string();
                        break;
                    }
                case 2: {
                        message.offset = reader.uint32();
                        break;
                    }
                case 3: {
                        message.limit = reader.uint32();
                        break;
                    }
                case 4: {
                        message.fetchFull = reader.bool();
                        break;
                    }
                case 5: {
                        message.starts = reader.int64();
                        break;
                    }
                case 6: {
                        message.ends = reader.int64();
                        break;
                    }
                case 7: {
                        message.window = reader.int32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a FetchRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.FetchRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.FetchRequest} FetchRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FetchRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a FetchRequest message.
         * @function verify
         * @memberof lukuid.FetchRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        FetchRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.query != null && message.hasOwnProperty("query"))
                if (!$util.isString(message.query))
                    return "query: string expected";
            if (message.offset != null && message.hasOwnProperty("offset"))
                if (!$util.isInteger(message.offset))
                    return "offset: integer expected";
            if (message.limit != null && message.hasOwnProperty("limit"))
                if (!$util.isInteger(message.limit))
                    return "limit: integer expected";
            if (message.fetchFull != null && message.hasOwnProperty("fetchFull"))
                if (typeof message.fetchFull !== "boolean")
                    return "fetchFull: boolean expected";
            if (message.starts != null && message.hasOwnProperty("starts"))
                if (!$util.isInteger(message.starts) && !(message.starts && $util.isInteger(message.starts.low) && $util.isInteger(message.starts.high)))
                    return "starts: integer|Long expected";
            if (message.ends != null && message.hasOwnProperty("ends"))
                if (!$util.isInteger(message.ends) && !(message.ends && $util.isInteger(message.ends.low) && $util.isInteger(message.ends.high)))
                    return "ends: integer|Long expected";
            if (message.window != null && message.hasOwnProperty("window"))
                switch (message.window) {
                default:
                    return "window: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                    break;
                }
            return null;
        };

        /**
         * Creates a FetchRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.FetchRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.FetchRequest} FetchRequest
         */
        FetchRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.FetchRequest)
                return object;
            let message = new $root.lukuid.FetchRequest();
            if (object.query != null)
                message.query = String(object.query);
            if (object.offset != null)
                message.offset = object.offset >>> 0;
            if (object.limit != null)
                message.limit = object.limit >>> 0;
            if (object.fetchFull != null)
                message.fetchFull = Boolean(object.fetchFull);
            if (object.starts != null)
                if ($util.Long)
                    (message.starts = $util.Long.fromValue(object.starts)).unsigned = false;
                else if (typeof object.starts === "string")
                    message.starts = parseInt(object.starts, 10);
                else if (typeof object.starts === "number")
                    message.starts = object.starts;
                else if (typeof object.starts === "object")
                    message.starts = new $util.LongBits(object.starts.low >>> 0, object.starts.high >>> 0).toNumber();
            if (object.ends != null)
                if ($util.Long)
                    (message.ends = $util.Long.fromValue(object.ends)).unsigned = false;
                else if (typeof object.ends === "string")
                    message.ends = parseInt(object.ends, 10);
                else if (typeof object.ends === "number")
                    message.ends = object.ends;
                else if (typeof object.ends === "object")
                    message.ends = new $util.LongBits(object.ends.low >>> 0, object.ends.high >>> 0).toNumber();
            switch (object.window) {
            default:
                if (typeof object.window === "number") {
                    message.window = object.window;
                    break;
                }
                break;
            case "FETCH_WINDOW_NONE":
            case 0:
                message.window = 0;
                break;
            case "FETCH_WINDOW_HOURLY":
            case 1:
                message.window = 1;
                break;
            case "FETCH_WINDOW_DAILY":
            case 2:
                message.window = 2;
                break;
            case "FETCH_WINDOW_WEEKLY":
            case 3:
                message.window = 3;
                break;
            case "FETCH_WINDOW_MONTHLY":
            case 4:
                message.window = 4;
                break;
            }
            return message;
        };

        /**
         * Creates a plain object from a FetchRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.FetchRequest
         * @static
         * @param {lukuid.FetchRequest} message FetchRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        FetchRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.query = "";
                object.offset = 0;
                object.limit = 0;
                object.fetchFull = false;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.starts = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.starts = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.ends = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.ends = options.longs === String ? "0" : 0;
                object.window = options.enums === String ? "FETCH_WINDOW_NONE" : 0;
            }
            if (message.query != null && message.hasOwnProperty("query"))
                object.query = message.query;
            if (message.offset != null && message.hasOwnProperty("offset"))
                object.offset = message.offset;
            if (message.limit != null && message.hasOwnProperty("limit"))
                object.limit = message.limit;
            if (message.fetchFull != null && message.hasOwnProperty("fetchFull"))
                object.fetchFull = message.fetchFull;
            if (message.starts != null && message.hasOwnProperty("starts"))
                if (typeof message.starts === "number")
                    object.starts = options.longs === String ? String(message.starts) : message.starts;
                else
                    object.starts = options.longs === String ? $util.Long.prototype.toString.call(message.starts) : options.longs === Number ? new $util.LongBits(message.starts.low >>> 0, message.starts.high >>> 0).toNumber() : message.starts;
            if (message.ends != null && message.hasOwnProperty("ends"))
                if (typeof message.ends === "number")
                    object.ends = options.longs === String ? String(message.ends) : message.ends;
                else
                    object.ends = options.longs === String ? $util.Long.prototype.toString.call(message.ends) : options.longs === Number ? new $util.LongBits(message.ends.low >>> 0, message.ends.high >>> 0).toNumber() : message.ends;
            if (message.window != null && message.hasOwnProperty("window"))
                object.window = options.enums === String ? $root.lukuid.FetchWindow[message.window] === undefined ? message.window : $root.lukuid.FetchWindow[message.window] : message.window;
            return object;
        };

        /**
         * Converts this FetchRequest to JSON.
         * @function toJSON
         * @memberof lukuid.FetchRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        FetchRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for FetchRequest
         * @function getTypeUrl
         * @memberof lukuid.FetchRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FetchRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.FetchRequest";
        };

        return FetchRequest;
    })();

    lukuid.GetRecordRequest = (function() {

        /**
         * Properties of a GetRecordRequest.
         * @memberof lukuid
         * @interface IGetRecordRequest
         * @property {string|null} [recordId] GetRecordRequest recordId
         */

        /**
         * Constructs a new GetRecordRequest.
         * @memberof lukuid
         * @classdesc Represents a GetRecordRequest.
         * @implements IGetRecordRequest
         * @constructor
         * @param {lukuid.IGetRecordRequest=} [properties] Properties to set
         */
        function GetRecordRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetRecordRequest recordId.
         * @member {string} recordId
         * @memberof lukuid.GetRecordRequest
         * @instance
         */
        GetRecordRequest.prototype.recordId = "";

        /**
         * Creates a new GetRecordRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.GetRecordRequest
         * @static
         * @param {lukuid.IGetRecordRequest=} [properties] Properties to set
         * @returns {lukuid.GetRecordRequest} GetRecordRequest instance
         */
        GetRecordRequest.create = function create(properties) {
            return new GetRecordRequest(properties);
        };

        /**
         * Encodes the specified GetRecordRequest message. Does not implicitly {@link lukuid.GetRecordRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.GetRecordRequest
         * @static
         * @param {lukuid.IGetRecordRequest} message GetRecordRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetRecordRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.recordId != null && Object.hasOwnProperty.call(message, "recordId"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.recordId);
            return writer;
        };

        /**
         * Encodes the specified GetRecordRequest message, length delimited. Does not implicitly {@link lukuid.GetRecordRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.GetRecordRequest
         * @static
         * @param {lukuid.IGetRecordRequest} message GetRecordRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetRecordRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetRecordRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.GetRecordRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.GetRecordRequest} GetRecordRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetRecordRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.GetRecordRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.recordId = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetRecordRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.GetRecordRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.GetRecordRequest} GetRecordRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetRecordRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetRecordRequest message.
         * @function verify
         * @memberof lukuid.GetRecordRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetRecordRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.recordId != null && message.hasOwnProperty("recordId"))
                if (!$util.isString(message.recordId))
                    return "recordId: string expected";
            return null;
        };

        /**
         * Creates a GetRecordRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.GetRecordRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.GetRecordRequest} GetRecordRequest
         */
        GetRecordRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.GetRecordRequest)
                return object;
            let message = new $root.lukuid.GetRecordRequest();
            if (object.recordId != null)
                message.recordId = String(object.recordId);
            return message;
        };

        /**
         * Creates a plain object from a GetRecordRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.GetRecordRequest
         * @static
         * @param {lukuid.GetRecordRequest} message GetRecordRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetRecordRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.recordId = "";
            if (message.recordId != null && message.hasOwnProperty("recordId"))
                object.recordId = message.recordId;
            return object;
        };

        /**
         * Converts this GetRecordRequest to JSON.
         * @function toJSON
         * @memberof lukuid.GetRecordRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetRecordRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GetRecordRequest
         * @function getTypeUrl
         * @memberof lukuid.GetRecordRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GetRecordRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.GetRecordRequest";
        };

        return GetRecordRequest;
    })();

    lukuid.AttestRequest = (function() {

        /**
         * Properties of an AttestRequest.
         * @memberof lukuid
         * @interface IAttestRequest
         * @property {string|null} [parentRecordId] AttestRequest parentRecordId
         * @property {Uint8Array|null} [signature] AttestRequest signature
         * @property {string|null} [checksum] AttestRequest checksum
         * @property {string|null} [mime] AttestRequest mime
         * @property {string|null} [type] AttestRequest type
         * @property {string|null} [title] AttestRequest title
         * @property {number|null} [lat] AttestRequest lat
         * @property {number|null} [lng] AttestRequest lng
         * @property {string|null} [content] AttestRequest content
         * @property {string|null} [merkleRoot] AttestRequest merkleRoot
         * @property {string|null} [custodyId] AttestRequest custodyId
         * @property {string|null} [event] AttestRequest event
         * @property {string|null} [status] AttestRequest status
         * @property {string|null} [contextRef] AttestRequest contextRef
         */

        /**
         * Constructs a new AttestRequest.
         * @memberof lukuid
         * @classdesc Represents an AttestRequest.
         * @implements IAttestRequest
         * @constructor
         * @param {lukuid.IAttestRequest=} [properties] Properties to set
         */
        function AttestRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AttestRequest parentRecordId.
         * @member {string} parentRecordId
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.parentRecordId = "";

        /**
         * AttestRequest signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.signature = $util.newBuffer([]);

        /**
         * AttestRequest checksum.
         * @member {string} checksum
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.checksum = "";

        /**
         * AttestRequest mime.
         * @member {string} mime
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.mime = "";

        /**
         * AttestRequest type.
         * @member {string} type
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.type = "";

        /**
         * AttestRequest title.
         * @member {string} title
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.title = "";

        /**
         * AttestRequest lat.
         * @member {number} lat
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.lat = 0;

        /**
         * AttestRequest lng.
         * @member {number} lng
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.lng = 0;

        /**
         * AttestRequest content.
         * @member {string} content
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.content = "";

        /**
         * AttestRequest merkleRoot.
         * @member {string} merkleRoot
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.merkleRoot = "";

        /**
         * AttestRequest custodyId.
         * @member {string} custodyId
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.custodyId = "";

        /**
         * AttestRequest event.
         * @member {string} event
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.event = "";

        /**
         * AttestRequest status.
         * @member {string} status
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.status = "";

        /**
         * AttestRequest contextRef.
         * @member {string} contextRef
         * @memberof lukuid.AttestRequest
         * @instance
         */
        AttestRequest.prototype.contextRef = "";

        /**
         * Creates a new AttestRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.AttestRequest
         * @static
         * @param {lukuid.IAttestRequest=} [properties] Properties to set
         * @returns {lukuid.AttestRequest} AttestRequest instance
         */
        AttestRequest.create = function create(properties) {
            return new AttestRequest(properties);
        };

        /**
         * Encodes the specified AttestRequest message. Does not implicitly {@link lukuid.AttestRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.AttestRequest
         * @static
         * @param {lukuid.IAttestRequest} message AttestRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AttestRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.parentRecordId != null && Object.hasOwnProperty.call(message, "parentRecordId"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.parentRecordId);
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.signature);
            if (message.checksum != null && Object.hasOwnProperty.call(message, "checksum"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.checksum);
            if (message.mime != null && Object.hasOwnProperty.call(message, "mime"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.mime);
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.type);
            if (message.title != null && Object.hasOwnProperty.call(message, "title"))
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.title);
            if (message.lat != null && Object.hasOwnProperty.call(message, "lat"))
                writer.uint32(/* id 8, wireType 1 =*/65).double(message.lat);
            if (message.lng != null && Object.hasOwnProperty.call(message, "lng"))
                writer.uint32(/* id 9, wireType 1 =*/73).double(message.lng);
            if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.content);
            if (message.merkleRoot != null && Object.hasOwnProperty.call(message, "merkleRoot"))
                writer.uint32(/* id 11, wireType 2 =*/90).string(message.merkleRoot);
            if (message.custodyId != null && Object.hasOwnProperty.call(message, "custodyId"))
                writer.uint32(/* id 12, wireType 2 =*/98).string(message.custodyId);
            if (message.event != null && Object.hasOwnProperty.call(message, "event"))
                writer.uint32(/* id 13, wireType 2 =*/106).string(message.event);
            if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                writer.uint32(/* id 14, wireType 2 =*/114).string(message.status);
            if (message.contextRef != null && Object.hasOwnProperty.call(message, "contextRef"))
                writer.uint32(/* id 15, wireType 2 =*/122).string(message.contextRef);
            return writer;
        };

        /**
         * Encodes the specified AttestRequest message, length delimited. Does not implicitly {@link lukuid.AttestRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.AttestRequest
         * @static
         * @param {lukuid.IAttestRequest} message AttestRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AttestRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AttestRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.AttestRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.AttestRequest} AttestRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AttestRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.AttestRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.parentRecordId = reader.string();
                        break;
                    }
                case 2: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 3: {
                        message.checksum = reader.string();
                        break;
                    }
                case 5: {
                        message.mime = reader.string();
                        break;
                    }
                case 6: {
                        message.type = reader.string();
                        break;
                    }
                case 7: {
                        message.title = reader.string();
                        break;
                    }
                case 8: {
                        message.lat = reader.double();
                        break;
                    }
                case 9: {
                        message.lng = reader.double();
                        break;
                    }
                case 10: {
                        message.content = reader.string();
                        break;
                    }
                case 11: {
                        message.merkleRoot = reader.string();
                        break;
                    }
                case 12: {
                        message.custodyId = reader.string();
                        break;
                    }
                case 13: {
                        message.event = reader.string();
                        break;
                    }
                case 14: {
                        message.status = reader.string();
                        break;
                    }
                case 15: {
                        message.contextRef = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AttestRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.AttestRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.AttestRequest} AttestRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AttestRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AttestRequest message.
         * @function verify
         * @memberof lukuid.AttestRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AttestRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.parentRecordId != null && message.hasOwnProperty("parentRecordId"))
                if (!$util.isString(message.parentRecordId))
                    return "parentRecordId: string expected";
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            if (message.checksum != null && message.hasOwnProperty("checksum"))
                if (!$util.isString(message.checksum))
                    return "checksum: string expected";
            if (message.mime != null && message.hasOwnProperty("mime"))
                if (!$util.isString(message.mime))
                    return "mime: string expected";
            if (message.type != null && message.hasOwnProperty("type"))
                if (!$util.isString(message.type))
                    return "type: string expected";
            if (message.title != null && message.hasOwnProperty("title"))
                if (!$util.isString(message.title))
                    return "title: string expected";
            if (message.lat != null && message.hasOwnProperty("lat"))
                if (typeof message.lat !== "number")
                    return "lat: number expected";
            if (message.lng != null && message.hasOwnProperty("lng"))
                if (typeof message.lng !== "number")
                    return "lng: number expected";
            if (message.content != null && message.hasOwnProperty("content"))
                if (!$util.isString(message.content))
                    return "content: string expected";
            if (message.merkleRoot != null && message.hasOwnProperty("merkleRoot"))
                if (!$util.isString(message.merkleRoot))
                    return "merkleRoot: string expected";
            if (message.custodyId != null && message.hasOwnProperty("custodyId"))
                if (!$util.isString(message.custodyId))
                    return "custodyId: string expected";
            if (message.event != null && message.hasOwnProperty("event"))
                if (!$util.isString(message.event))
                    return "event: string expected";
            if (message.status != null && message.hasOwnProperty("status"))
                if (!$util.isString(message.status))
                    return "status: string expected";
            if (message.contextRef != null && message.hasOwnProperty("contextRef"))
                if (!$util.isString(message.contextRef))
                    return "contextRef: string expected";
            return null;
        };

        /**
         * Creates an AttestRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.AttestRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.AttestRequest} AttestRequest
         */
        AttestRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.AttestRequest)
                return object;
            let message = new $root.lukuid.AttestRequest();
            if (object.parentRecordId != null)
                message.parentRecordId = String(object.parentRecordId);
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.checksum != null)
                message.checksum = String(object.checksum);
            if (object.mime != null)
                message.mime = String(object.mime);
            if (object.type != null)
                message.type = String(object.type);
            if (object.title != null)
                message.title = String(object.title);
            if (object.lat != null)
                message.lat = Number(object.lat);
            if (object.lng != null)
                message.lng = Number(object.lng);
            if (object.content != null)
                message.content = String(object.content);
            if (object.merkleRoot != null)
                message.merkleRoot = String(object.merkleRoot);
            if (object.custodyId != null)
                message.custodyId = String(object.custodyId);
            if (object.event != null)
                message.event = String(object.event);
            if (object.status != null)
                message.status = String(object.status);
            if (object.contextRef != null)
                message.contextRef = String(object.contextRef);
            return message;
        };

        /**
         * Creates a plain object from an AttestRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.AttestRequest
         * @static
         * @param {lukuid.AttestRequest} message AttestRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AttestRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.parentRecordId = "";
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
                object.checksum = "";
                object.mime = "";
                object.type = "";
                object.title = "";
                object.lat = 0;
                object.lng = 0;
                object.content = "";
                object.merkleRoot = "";
                object.custodyId = "";
                object.event = "";
                object.status = "";
                object.contextRef = "";
            }
            if (message.parentRecordId != null && message.hasOwnProperty("parentRecordId"))
                object.parentRecordId = message.parentRecordId;
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            if (message.checksum != null && message.hasOwnProperty("checksum"))
                object.checksum = message.checksum;
            if (message.mime != null && message.hasOwnProperty("mime"))
                object.mime = message.mime;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = message.type;
            if (message.title != null && message.hasOwnProperty("title"))
                object.title = message.title;
            if (message.lat != null && message.hasOwnProperty("lat"))
                object.lat = options.json && !isFinite(message.lat) ? String(message.lat) : message.lat;
            if (message.lng != null && message.hasOwnProperty("lng"))
                object.lng = options.json && !isFinite(message.lng) ? String(message.lng) : message.lng;
            if (message.content != null && message.hasOwnProperty("content"))
                object.content = message.content;
            if (message.merkleRoot != null && message.hasOwnProperty("merkleRoot"))
                object.merkleRoot = message.merkleRoot;
            if (message.custodyId != null && message.hasOwnProperty("custodyId"))
                object.custodyId = message.custodyId;
            if (message.event != null && message.hasOwnProperty("event"))
                object.event = message.event;
            if (message.status != null && message.hasOwnProperty("status"))
                object.status = message.status;
            if (message.contextRef != null && message.hasOwnProperty("contextRef"))
                object.contextRef = message.contextRef;
            return object;
        };

        /**
         * Converts this AttestRequest to JSON.
         * @function toJSON
         * @memberof lukuid.AttestRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AttestRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for AttestRequest
         * @function getTypeUrl
         * @memberof lukuid.AttestRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        AttestRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.AttestRequest";
        };

        return AttestRequest;
    })();

    lukuid.ConfigRequest = (function() {

        /**
         * Properties of a ConfigRequest.
         * @memberof lukuid
         * @interface IConfigRequest
         * @property {string|null} [name] ConfigRequest name
         * @property {string|null} [wifiSsid] ConfigRequest wifiSsid
         * @property {string|null} [wifiPassword] ConfigRequest wifiPassword
         * @property {string|null} [mqttBrokerUrl] ConfigRequest mqttBrokerUrl
         * @property {number|null} [mqttPort] ConfigRequest mqttPort
         * @property {string|null} [mqttTopic] ConfigRequest mqttTopic
         * @property {number|null} [mqttBroadcastFrequencySeconds] ConfigRequest mqttBroadcastFrequencySeconds
         * @property {string|null} [mqttUsername] ConfigRequest mqttUsername
         * @property {string|null} [mqttPassword] ConfigRequest mqttPassword
         * @property {Uint8Array|null} [mqttCertificateDer] ConfigRequest mqttCertificateDer
         * @property {Uint8Array|null} [mqttCaDer] ConfigRequest mqttCaDer
         * @property {boolean|null} [mqttBroadcastEnabled] ConfigRequest mqttBroadcastEnabled
         * @property {string|null} [customHeartbeatUrl] ConfigRequest customHeartbeatUrl
         * @property {boolean|null} [telemetryEnabled] ConfigRequest telemetryEnabled
         */

        /**
         * Constructs a new ConfigRequest.
         * @memberof lukuid
         * @classdesc Represents a ConfigRequest.
         * @implements IConfigRequest
         * @constructor
         * @param {lukuid.IConfigRequest=} [properties] Properties to set
         */
        function ConfigRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ConfigRequest name.
         * @member {string|null|undefined} name
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.name = null;

        /**
         * ConfigRequest wifiSsid.
         * @member {string|null|undefined} wifiSsid
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.wifiSsid = null;

        /**
         * ConfigRequest wifiPassword.
         * @member {string|null|undefined} wifiPassword
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.wifiPassword = null;

        /**
         * ConfigRequest mqttBrokerUrl.
         * @member {string|null|undefined} mqttBrokerUrl
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.mqttBrokerUrl = null;

        /**
         * ConfigRequest mqttPort.
         * @member {number|null|undefined} mqttPort
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.mqttPort = null;

        /**
         * ConfigRequest mqttTopic.
         * @member {string|null|undefined} mqttTopic
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.mqttTopic = null;

        /**
         * ConfigRequest mqttBroadcastFrequencySeconds.
         * @member {number|null|undefined} mqttBroadcastFrequencySeconds
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.mqttBroadcastFrequencySeconds = null;

        /**
         * ConfigRequest mqttUsername.
         * @member {string|null|undefined} mqttUsername
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.mqttUsername = null;

        /**
         * ConfigRequest mqttPassword.
         * @member {string|null|undefined} mqttPassword
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.mqttPassword = null;

        /**
         * ConfigRequest mqttCertificateDer.
         * @member {Uint8Array|null|undefined} mqttCertificateDer
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.mqttCertificateDer = null;

        /**
         * ConfigRequest mqttCaDer.
         * @member {Uint8Array|null|undefined} mqttCaDer
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.mqttCaDer = null;

        /**
         * ConfigRequest mqttBroadcastEnabled.
         * @member {boolean|null|undefined} mqttBroadcastEnabled
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.mqttBroadcastEnabled = null;

        /**
         * ConfigRequest customHeartbeatUrl.
         * @member {string|null|undefined} customHeartbeatUrl
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.customHeartbeatUrl = null;

        /**
         * ConfigRequest telemetryEnabled.
         * @member {boolean|null|undefined} telemetryEnabled
         * @memberof lukuid.ConfigRequest
         * @instance
         */
        ConfigRequest.prototype.telemetryEnabled = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_name", {
            get: $util.oneOfGetter($oneOfFields = ["name"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_wifiSsid", {
            get: $util.oneOfGetter($oneOfFields = ["wifiSsid"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_wifiPassword", {
            get: $util.oneOfGetter($oneOfFields = ["wifiPassword"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_mqttBrokerUrl", {
            get: $util.oneOfGetter($oneOfFields = ["mqttBrokerUrl"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_mqttPort", {
            get: $util.oneOfGetter($oneOfFields = ["mqttPort"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_mqttTopic", {
            get: $util.oneOfGetter($oneOfFields = ["mqttTopic"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_mqttBroadcastFrequencySeconds", {
            get: $util.oneOfGetter($oneOfFields = ["mqttBroadcastFrequencySeconds"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_mqttUsername", {
            get: $util.oneOfGetter($oneOfFields = ["mqttUsername"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_mqttPassword", {
            get: $util.oneOfGetter($oneOfFields = ["mqttPassword"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_mqttCertificateDer", {
            get: $util.oneOfGetter($oneOfFields = ["mqttCertificateDer"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_mqttCaDer", {
            get: $util.oneOfGetter($oneOfFields = ["mqttCaDer"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_mqttBroadcastEnabled", {
            get: $util.oneOfGetter($oneOfFields = ["mqttBroadcastEnabled"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_customHeartbeatUrl", {
            get: $util.oneOfGetter($oneOfFields = ["customHeartbeatUrl"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(ConfigRequest.prototype, "_telemetryEnabled", {
            get: $util.oneOfGetter($oneOfFields = ["telemetryEnabled"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new ConfigRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.ConfigRequest
         * @static
         * @param {lukuid.IConfigRequest=} [properties] Properties to set
         * @returns {lukuid.ConfigRequest} ConfigRequest instance
         */
        ConfigRequest.create = function create(properties) {
            return new ConfigRequest(properties);
        };

        /**
         * Encodes the specified ConfigRequest message. Does not implicitly {@link lukuid.ConfigRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.ConfigRequest
         * @static
         * @param {lukuid.IConfigRequest} message ConfigRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ConfigRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
            if (message.wifiSsid != null && Object.hasOwnProperty.call(message, "wifiSsid"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.wifiSsid);
            if (message.wifiPassword != null && Object.hasOwnProperty.call(message, "wifiPassword"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.wifiPassword);
            if (message.mqttBrokerUrl != null && Object.hasOwnProperty.call(message, "mqttBrokerUrl"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.mqttBrokerUrl);
            if (message.mqttPort != null && Object.hasOwnProperty.call(message, "mqttPort"))
                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.mqttPort);
            if (message.mqttTopic != null && Object.hasOwnProperty.call(message, "mqttTopic"))
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.mqttTopic);
            if (message.mqttBroadcastFrequencySeconds != null && Object.hasOwnProperty.call(message, "mqttBroadcastFrequencySeconds"))
                writer.uint32(/* id 7, wireType 0 =*/56).uint32(message.mqttBroadcastFrequencySeconds);
            if (message.mqttUsername != null && Object.hasOwnProperty.call(message, "mqttUsername"))
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.mqttUsername);
            if (message.mqttPassword != null && Object.hasOwnProperty.call(message, "mqttPassword"))
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.mqttPassword);
            if (message.mqttCertificateDer != null && Object.hasOwnProperty.call(message, "mqttCertificateDer"))
                writer.uint32(/* id 10, wireType 2 =*/82).bytes(message.mqttCertificateDer);
            if (message.mqttCaDer != null && Object.hasOwnProperty.call(message, "mqttCaDer"))
                writer.uint32(/* id 11, wireType 2 =*/90).bytes(message.mqttCaDer);
            if (message.mqttBroadcastEnabled != null && Object.hasOwnProperty.call(message, "mqttBroadcastEnabled"))
                writer.uint32(/* id 12, wireType 0 =*/96).bool(message.mqttBroadcastEnabled);
            if (message.customHeartbeatUrl != null && Object.hasOwnProperty.call(message, "customHeartbeatUrl"))
                writer.uint32(/* id 13, wireType 2 =*/106).string(message.customHeartbeatUrl);
            if (message.telemetryEnabled != null && Object.hasOwnProperty.call(message, "telemetryEnabled"))
                writer.uint32(/* id 14, wireType 0 =*/112).bool(message.telemetryEnabled);
            return writer;
        };

        /**
         * Encodes the specified ConfigRequest message, length delimited. Does not implicitly {@link lukuid.ConfigRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.ConfigRequest
         * @static
         * @param {lukuid.IConfigRequest} message ConfigRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ConfigRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ConfigRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.ConfigRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.ConfigRequest} ConfigRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ConfigRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.ConfigRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.name = reader.string();
                        break;
                    }
                case 2: {
                        message.wifiSsid = reader.string();
                        break;
                    }
                case 3: {
                        message.wifiPassword = reader.string();
                        break;
                    }
                case 4: {
                        message.mqttBrokerUrl = reader.string();
                        break;
                    }
                case 5: {
                        message.mqttPort = reader.uint32();
                        break;
                    }
                case 6: {
                        message.mqttTopic = reader.string();
                        break;
                    }
                case 7: {
                        message.mqttBroadcastFrequencySeconds = reader.uint32();
                        break;
                    }
                case 8: {
                        message.mqttUsername = reader.string();
                        break;
                    }
                case 9: {
                        message.mqttPassword = reader.string();
                        break;
                    }
                case 10: {
                        message.mqttCertificateDer = reader.bytes();
                        break;
                    }
                case 11: {
                        message.mqttCaDer = reader.bytes();
                        break;
                    }
                case 12: {
                        message.mqttBroadcastEnabled = reader.bool();
                        break;
                    }
                case 13: {
                        message.customHeartbeatUrl = reader.string();
                        break;
                    }
                case 14: {
                        message.telemetryEnabled = reader.bool();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ConfigRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.ConfigRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.ConfigRequest} ConfigRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ConfigRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ConfigRequest message.
         * @function verify
         * @memberof lukuid.ConfigRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ConfigRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.name != null && message.hasOwnProperty("name")) {
                properties._name = 1;
                if (!$util.isString(message.name))
                    return "name: string expected";
            }
            if (message.wifiSsid != null && message.hasOwnProperty("wifiSsid")) {
                properties._wifiSsid = 1;
                if (!$util.isString(message.wifiSsid))
                    return "wifiSsid: string expected";
            }
            if (message.wifiPassword != null && message.hasOwnProperty("wifiPassword")) {
                properties._wifiPassword = 1;
                if (!$util.isString(message.wifiPassword))
                    return "wifiPassword: string expected";
            }
            if (message.mqttBrokerUrl != null && message.hasOwnProperty("mqttBrokerUrl")) {
                properties._mqttBrokerUrl = 1;
                if (!$util.isString(message.mqttBrokerUrl))
                    return "mqttBrokerUrl: string expected";
            }
            if (message.mqttPort != null && message.hasOwnProperty("mqttPort")) {
                properties._mqttPort = 1;
                if (!$util.isInteger(message.mqttPort))
                    return "mqttPort: integer expected";
            }
            if (message.mqttTopic != null && message.hasOwnProperty("mqttTopic")) {
                properties._mqttTopic = 1;
                if (!$util.isString(message.mqttTopic))
                    return "mqttTopic: string expected";
            }
            if (message.mqttBroadcastFrequencySeconds != null && message.hasOwnProperty("mqttBroadcastFrequencySeconds")) {
                properties._mqttBroadcastFrequencySeconds = 1;
                if (!$util.isInteger(message.mqttBroadcastFrequencySeconds))
                    return "mqttBroadcastFrequencySeconds: integer expected";
            }
            if (message.mqttUsername != null && message.hasOwnProperty("mqttUsername")) {
                properties._mqttUsername = 1;
                if (!$util.isString(message.mqttUsername))
                    return "mqttUsername: string expected";
            }
            if (message.mqttPassword != null && message.hasOwnProperty("mqttPassword")) {
                properties._mqttPassword = 1;
                if (!$util.isString(message.mqttPassword))
                    return "mqttPassword: string expected";
            }
            if (message.mqttCertificateDer != null && message.hasOwnProperty("mqttCertificateDer")) {
                properties._mqttCertificateDer = 1;
                if (!(message.mqttCertificateDer && typeof message.mqttCertificateDer.length === "number" || $util.isString(message.mqttCertificateDer)))
                    return "mqttCertificateDer: buffer expected";
            }
            if (message.mqttCaDer != null && message.hasOwnProperty("mqttCaDer")) {
                properties._mqttCaDer = 1;
                if (!(message.mqttCaDer && typeof message.mqttCaDer.length === "number" || $util.isString(message.mqttCaDer)))
                    return "mqttCaDer: buffer expected";
            }
            if (message.mqttBroadcastEnabled != null && message.hasOwnProperty("mqttBroadcastEnabled")) {
                properties._mqttBroadcastEnabled = 1;
                if (typeof message.mqttBroadcastEnabled !== "boolean")
                    return "mqttBroadcastEnabled: boolean expected";
            }
            if (message.customHeartbeatUrl != null && message.hasOwnProperty("customHeartbeatUrl")) {
                properties._customHeartbeatUrl = 1;
                if (!$util.isString(message.customHeartbeatUrl))
                    return "customHeartbeatUrl: string expected";
            }
            if (message.telemetryEnabled != null && message.hasOwnProperty("telemetryEnabled")) {
                properties._telemetryEnabled = 1;
                if (typeof message.telemetryEnabled !== "boolean")
                    return "telemetryEnabled: boolean expected";
            }
            return null;
        };

        /**
         * Creates a ConfigRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.ConfigRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.ConfigRequest} ConfigRequest
         */
        ConfigRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.ConfigRequest)
                return object;
            let message = new $root.lukuid.ConfigRequest();
            if (object.name != null)
                message.name = String(object.name);
            if (object.wifiSsid != null)
                message.wifiSsid = String(object.wifiSsid);
            if (object.wifiPassword != null)
                message.wifiPassword = String(object.wifiPassword);
            if (object.mqttBrokerUrl != null)
                message.mqttBrokerUrl = String(object.mqttBrokerUrl);
            if (object.mqttPort != null)
                message.mqttPort = object.mqttPort >>> 0;
            if (object.mqttTopic != null)
                message.mqttTopic = String(object.mqttTopic);
            if (object.mqttBroadcastFrequencySeconds != null)
                message.mqttBroadcastFrequencySeconds = object.mqttBroadcastFrequencySeconds >>> 0;
            if (object.mqttUsername != null)
                message.mqttUsername = String(object.mqttUsername);
            if (object.mqttPassword != null)
                message.mqttPassword = String(object.mqttPassword);
            if (object.mqttCertificateDer != null)
                if (typeof object.mqttCertificateDer === "string")
                    $util.base64.decode(object.mqttCertificateDer, message.mqttCertificateDer = $util.newBuffer($util.base64.length(object.mqttCertificateDer)), 0);
                else if (object.mqttCertificateDer.length >= 0)
                    message.mqttCertificateDer = object.mqttCertificateDer;
            if (object.mqttCaDer != null)
                if (typeof object.mqttCaDer === "string")
                    $util.base64.decode(object.mqttCaDer, message.mqttCaDer = $util.newBuffer($util.base64.length(object.mqttCaDer)), 0);
                else if (object.mqttCaDer.length >= 0)
                    message.mqttCaDer = object.mqttCaDer;
            if (object.mqttBroadcastEnabled != null)
                message.mqttBroadcastEnabled = Boolean(object.mqttBroadcastEnabled);
            if (object.customHeartbeatUrl != null)
                message.customHeartbeatUrl = String(object.customHeartbeatUrl);
            if (object.telemetryEnabled != null)
                message.telemetryEnabled = Boolean(object.telemetryEnabled);
            return message;
        };

        /**
         * Creates a plain object from a ConfigRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.ConfigRequest
         * @static
         * @param {lukuid.ConfigRequest} message ConfigRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ConfigRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (message.name != null && message.hasOwnProperty("name")) {
                object.name = message.name;
                if (options.oneofs)
                    object._name = "name";
            }
            if (message.wifiSsid != null && message.hasOwnProperty("wifiSsid")) {
                object.wifiSsid = message.wifiSsid;
                if (options.oneofs)
                    object._wifiSsid = "wifiSsid";
            }
            if (message.wifiPassword != null && message.hasOwnProperty("wifiPassword")) {
                object.wifiPassword = message.wifiPassword;
                if (options.oneofs)
                    object._wifiPassword = "wifiPassword";
            }
            if (message.mqttBrokerUrl != null && message.hasOwnProperty("mqttBrokerUrl")) {
                object.mqttBrokerUrl = message.mqttBrokerUrl;
                if (options.oneofs)
                    object._mqttBrokerUrl = "mqttBrokerUrl";
            }
            if (message.mqttPort != null && message.hasOwnProperty("mqttPort")) {
                object.mqttPort = message.mqttPort;
                if (options.oneofs)
                    object._mqttPort = "mqttPort";
            }
            if (message.mqttTopic != null && message.hasOwnProperty("mqttTopic")) {
                object.mqttTopic = message.mqttTopic;
                if (options.oneofs)
                    object._mqttTopic = "mqttTopic";
            }
            if (message.mqttBroadcastFrequencySeconds != null && message.hasOwnProperty("mqttBroadcastFrequencySeconds")) {
                object.mqttBroadcastFrequencySeconds = message.mqttBroadcastFrequencySeconds;
                if (options.oneofs)
                    object._mqttBroadcastFrequencySeconds = "mqttBroadcastFrequencySeconds";
            }
            if (message.mqttUsername != null && message.hasOwnProperty("mqttUsername")) {
                object.mqttUsername = message.mqttUsername;
                if (options.oneofs)
                    object._mqttUsername = "mqttUsername";
            }
            if (message.mqttPassword != null && message.hasOwnProperty("mqttPassword")) {
                object.mqttPassword = message.mqttPassword;
                if (options.oneofs)
                    object._mqttPassword = "mqttPassword";
            }
            if (message.mqttCertificateDer != null && message.hasOwnProperty("mqttCertificateDer")) {
                object.mqttCertificateDer = options.bytes === String ? $util.base64.encode(message.mqttCertificateDer, 0, message.mqttCertificateDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.mqttCertificateDer) : message.mqttCertificateDer;
                if (options.oneofs)
                    object._mqttCertificateDer = "mqttCertificateDer";
            }
            if (message.mqttCaDer != null && message.hasOwnProperty("mqttCaDer")) {
                object.mqttCaDer = options.bytes === String ? $util.base64.encode(message.mqttCaDer, 0, message.mqttCaDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.mqttCaDer) : message.mqttCaDer;
                if (options.oneofs)
                    object._mqttCaDer = "mqttCaDer";
            }
            if (message.mqttBroadcastEnabled != null && message.hasOwnProperty("mqttBroadcastEnabled")) {
                object.mqttBroadcastEnabled = message.mqttBroadcastEnabled;
                if (options.oneofs)
                    object._mqttBroadcastEnabled = "mqttBroadcastEnabled";
            }
            if (message.customHeartbeatUrl != null && message.hasOwnProperty("customHeartbeatUrl")) {
                object.customHeartbeatUrl = message.customHeartbeatUrl;
                if (options.oneofs)
                    object._customHeartbeatUrl = "customHeartbeatUrl";
            }
            if (message.telemetryEnabled != null && message.hasOwnProperty("telemetryEnabled")) {
                object.telemetryEnabled = message.telemetryEnabled;
                if (options.oneofs)
                    object._telemetryEnabled = "telemetryEnabled";
            }
            return object;
        };

        /**
         * Converts this ConfigRequest to JSON.
         * @function toJSON
         * @memberof lukuid.ConfigRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ConfigRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ConfigRequest
         * @function getTypeUrl
         * @memberof lukuid.ConfigRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ConfigRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.ConfigRequest";
        };

        return ConfigRequest;
    })();

    lukuid.OtaBeginRequest = (function() {

        /**
         * Properties of an OtaBeginRequest.
         * @memberof lukuid
         * @interface IOtaBeginRequest
         * @property {number|null} [size] OtaBeginRequest size
         * @property {Uint8Array|null} [publicKey] OtaBeginRequest publicKey
         * @property {boolean|null} [binaryMode] OtaBeginRequest binaryMode
         */

        /**
         * Constructs a new OtaBeginRequest.
         * @memberof lukuid
         * @classdesc Represents an OtaBeginRequest.
         * @implements IOtaBeginRequest
         * @constructor
         * @param {lukuid.IOtaBeginRequest=} [properties] Properties to set
         */
        function OtaBeginRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * OtaBeginRequest size.
         * @member {number} size
         * @memberof lukuid.OtaBeginRequest
         * @instance
         */
        OtaBeginRequest.prototype.size = 0;

        /**
         * OtaBeginRequest publicKey.
         * @member {Uint8Array} publicKey
         * @memberof lukuid.OtaBeginRequest
         * @instance
         */
        OtaBeginRequest.prototype.publicKey = $util.newBuffer([]);

        /**
         * OtaBeginRequest binaryMode.
         * @member {boolean} binaryMode
         * @memberof lukuid.OtaBeginRequest
         * @instance
         */
        OtaBeginRequest.prototype.binaryMode = false;

        /**
         * Creates a new OtaBeginRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.OtaBeginRequest
         * @static
         * @param {lukuid.IOtaBeginRequest=} [properties] Properties to set
         * @returns {lukuid.OtaBeginRequest} OtaBeginRequest instance
         */
        OtaBeginRequest.create = function create(properties) {
            return new OtaBeginRequest(properties);
        };

        /**
         * Encodes the specified OtaBeginRequest message. Does not implicitly {@link lukuid.OtaBeginRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.OtaBeginRequest
         * @static
         * @param {lukuid.IOtaBeginRequest} message OtaBeginRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaBeginRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.size != null && Object.hasOwnProperty.call(message, "size"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.size);
            if (message.publicKey != null && Object.hasOwnProperty.call(message, "publicKey"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.publicKey);
            if (message.binaryMode != null && Object.hasOwnProperty.call(message, "binaryMode"))
                writer.uint32(/* id 3, wireType 0 =*/24).bool(message.binaryMode);
            return writer;
        };

        /**
         * Encodes the specified OtaBeginRequest message, length delimited. Does not implicitly {@link lukuid.OtaBeginRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.OtaBeginRequest
         * @static
         * @param {lukuid.IOtaBeginRequest} message OtaBeginRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaBeginRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an OtaBeginRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.OtaBeginRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.OtaBeginRequest} OtaBeginRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaBeginRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.OtaBeginRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.size = reader.uint32();
                        break;
                    }
                case 2: {
                        message.publicKey = reader.bytes();
                        break;
                    }
                case 3: {
                        message.binaryMode = reader.bool();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an OtaBeginRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.OtaBeginRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.OtaBeginRequest} OtaBeginRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaBeginRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an OtaBeginRequest message.
         * @function verify
         * @memberof lukuid.OtaBeginRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        OtaBeginRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.size != null && message.hasOwnProperty("size"))
                if (!$util.isInteger(message.size))
                    return "size: integer expected";
            if (message.publicKey != null && message.hasOwnProperty("publicKey"))
                if (!(message.publicKey && typeof message.publicKey.length === "number" || $util.isString(message.publicKey)))
                    return "publicKey: buffer expected";
            if (message.binaryMode != null && message.hasOwnProperty("binaryMode"))
                if (typeof message.binaryMode !== "boolean")
                    return "binaryMode: boolean expected";
            return null;
        };

        /**
         * Creates an OtaBeginRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.OtaBeginRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.OtaBeginRequest} OtaBeginRequest
         */
        OtaBeginRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.OtaBeginRequest)
                return object;
            let message = new $root.lukuid.OtaBeginRequest();
            if (object.size != null)
                message.size = object.size >>> 0;
            if (object.publicKey != null)
                if (typeof object.publicKey === "string")
                    $util.base64.decode(object.publicKey, message.publicKey = $util.newBuffer($util.base64.length(object.publicKey)), 0);
                else if (object.publicKey.length >= 0)
                    message.publicKey = object.publicKey;
            if (object.binaryMode != null)
                message.binaryMode = Boolean(object.binaryMode);
            return message;
        };

        /**
         * Creates a plain object from an OtaBeginRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.OtaBeginRequest
         * @static
         * @param {lukuid.OtaBeginRequest} message OtaBeginRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        OtaBeginRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.size = 0;
                if (options.bytes === String)
                    object.publicKey = "";
                else {
                    object.publicKey = [];
                    if (options.bytes !== Array)
                        object.publicKey = $util.newBuffer(object.publicKey);
                }
                object.binaryMode = false;
            }
            if (message.size != null && message.hasOwnProperty("size"))
                object.size = message.size;
            if (message.publicKey != null && message.hasOwnProperty("publicKey"))
                object.publicKey = options.bytes === String ? $util.base64.encode(message.publicKey, 0, message.publicKey.length) : options.bytes === Array ? Array.prototype.slice.call(message.publicKey) : message.publicKey;
            if (message.binaryMode != null && message.hasOwnProperty("binaryMode"))
                object.binaryMode = message.binaryMode;
            return object;
        };

        /**
         * Converts this OtaBeginRequest to JSON.
         * @function toJSON
         * @memberof lukuid.OtaBeginRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        OtaBeginRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for OtaBeginRequest
         * @function getTypeUrl
         * @memberof lukuid.OtaBeginRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        OtaBeginRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.OtaBeginRequest";
        };

        return OtaBeginRequest;
    })();

    lukuid.OtaDataRequest = (function() {

        /**
         * Properties of an OtaDataRequest.
         * @memberof lukuid
         * @interface IOtaDataRequest
         * @property {Uint8Array|null} [data] OtaDataRequest data
         * @property {number|null} [offset] OtaDataRequest offset
         */

        /**
         * Constructs a new OtaDataRequest.
         * @memberof lukuid
         * @classdesc Represents an OtaDataRequest.
         * @implements IOtaDataRequest
         * @constructor
         * @param {lukuid.IOtaDataRequest=} [properties] Properties to set
         */
        function OtaDataRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * OtaDataRequest data.
         * @member {Uint8Array} data
         * @memberof lukuid.OtaDataRequest
         * @instance
         */
        OtaDataRequest.prototype.data = $util.newBuffer([]);

        /**
         * OtaDataRequest offset.
         * @member {number} offset
         * @memberof lukuid.OtaDataRequest
         * @instance
         */
        OtaDataRequest.prototype.offset = 0;

        /**
         * Creates a new OtaDataRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.OtaDataRequest
         * @static
         * @param {lukuid.IOtaDataRequest=} [properties] Properties to set
         * @returns {lukuid.OtaDataRequest} OtaDataRequest instance
         */
        OtaDataRequest.create = function create(properties) {
            return new OtaDataRequest(properties);
        };

        /**
         * Encodes the specified OtaDataRequest message. Does not implicitly {@link lukuid.OtaDataRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.OtaDataRequest
         * @static
         * @param {lukuid.IOtaDataRequest} message OtaDataRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaDataRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.data);
            if (message.offset != null && Object.hasOwnProperty.call(message, "offset"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.offset);
            return writer;
        };

        /**
         * Encodes the specified OtaDataRequest message, length delimited. Does not implicitly {@link lukuid.OtaDataRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.OtaDataRequest
         * @static
         * @param {lukuid.IOtaDataRequest} message OtaDataRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaDataRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an OtaDataRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.OtaDataRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.OtaDataRequest} OtaDataRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaDataRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.OtaDataRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.data = reader.bytes();
                        break;
                    }
                case 2: {
                        message.offset = reader.uint32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an OtaDataRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.OtaDataRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.OtaDataRequest} OtaDataRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaDataRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an OtaDataRequest message.
         * @function verify
         * @memberof lukuid.OtaDataRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        OtaDataRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                    return "data: buffer expected";
            if (message.offset != null && message.hasOwnProperty("offset"))
                if (!$util.isInteger(message.offset))
                    return "offset: integer expected";
            return null;
        };

        /**
         * Creates an OtaDataRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.OtaDataRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.OtaDataRequest} OtaDataRequest
         */
        OtaDataRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.OtaDataRequest)
                return object;
            let message = new $root.lukuid.OtaDataRequest();
            if (object.data != null)
                if (typeof object.data === "string")
                    $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                else if (object.data.length >= 0)
                    message.data = object.data;
            if (object.offset != null)
                message.offset = object.offset >>> 0;
            return message;
        };

        /**
         * Creates a plain object from an OtaDataRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.OtaDataRequest
         * @static
         * @param {lukuid.OtaDataRequest} message OtaDataRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        OtaDataRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if (options.bytes === String)
                    object.data = "";
                else {
                    object.data = [];
                    if (options.bytes !== Array)
                        object.data = $util.newBuffer(object.data);
                }
                object.offset = 0;
            }
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
            if (message.offset != null && message.hasOwnProperty("offset"))
                object.offset = message.offset;
            return object;
        };

        /**
         * Converts this OtaDataRequest to JSON.
         * @function toJSON
         * @memberof lukuid.OtaDataRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        OtaDataRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for OtaDataRequest
         * @function getTypeUrl
         * @memberof lukuid.OtaDataRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        OtaDataRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.OtaDataRequest";
        };

        return OtaDataRequest;
    })();

    lukuid.OtaEndRequest = (function() {

        /**
         * Properties of an OtaEndRequest.
         * @memberof lukuid
         * @interface IOtaEndRequest
         * @property {Uint8Array|null} [signature] OtaEndRequest signature
         */

        /**
         * Constructs a new OtaEndRequest.
         * @memberof lukuid
         * @classdesc Represents an OtaEndRequest.
         * @implements IOtaEndRequest
         * @constructor
         * @param {lukuid.IOtaEndRequest=} [properties] Properties to set
         */
        function OtaEndRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * OtaEndRequest signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.OtaEndRequest
         * @instance
         */
        OtaEndRequest.prototype.signature = $util.newBuffer([]);

        /**
         * Creates a new OtaEndRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.OtaEndRequest
         * @static
         * @param {lukuid.IOtaEndRequest=} [properties] Properties to set
         * @returns {lukuid.OtaEndRequest} OtaEndRequest instance
         */
        OtaEndRequest.create = function create(properties) {
            return new OtaEndRequest(properties);
        };

        /**
         * Encodes the specified OtaEndRequest message. Does not implicitly {@link lukuid.OtaEndRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.OtaEndRequest
         * @static
         * @param {lukuid.IOtaEndRequest} message OtaEndRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaEndRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.signature);
            return writer;
        };

        /**
         * Encodes the specified OtaEndRequest message, length delimited. Does not implicitly {@link lukuid.OtaEndRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.OtaEndRequest
         * @static
         * @param {lukuid.IOtaEndRequest} message OtaEndRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaEndRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an OtaEndRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.OtaEndRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.OtaEndRequest} OtaEndRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaEndRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.OtaEndRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.signature = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an OtaEndRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.OtaEndRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.OtaEndRequest} OtaEndRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaEndRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an OtaEndRequest message.
         * @function verify
         * @memberof lukuid.OtaEndRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        OtaEndRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            return null;
        };

        /**
         * Creates an OtaEndRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.OtaEndRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.OtaEndRequest} OtaEndRequest
         */
        OtaEndRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.OtaEndRequest)
                return object;
            let message = new $root.lukuid.OtaEndRequest();
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            return message;
        };

        /**
         * Creates a plain object from an OtaEndRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.OtaEndRequest
         * @static
         * @param {lukuid.OtaEndRequest} message OtaEndRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        OtaEndRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            return object;
        };

        /**
         * Converts this OtaEndRequest to JSON.
         * @function toJSON
         * @memberof lukuid.OtaEndRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        OtaEndRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for OtaEndRequest
         * @function getTypeUrl
         * @memberof lukuid.OtaEndRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        OtaEndRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.OtaEndRequest";
        };

        return OtaEndRequest;
    })();

    lukuid.SetAttestationRequest = (function() {

        /**
         * Properties of a SetAttestationRequest.
         * @memberof lukuid
         * @interface ISetAttestationRequest
         * @property {Uint8Array|null} [dacDer] SetAttestationRequest dacDer
         * @property {Uint8Array|null} [manufacturerDer] SetAttestationRequest manufacturerDer
         * @property {Uint8Array|null} [signature] SetAttestationRequest signature
         * @property {number|Long|null} [counter] SetAttestationRequest counter
         * @property {string|null} [nonce] SetAttestationRequest nonce
         * @property {Uint8Array|null} [intermediateDer] SetAttestationRequest intermediateDer
         */

        /**
         * Constructs a new SetAttestationRequest.
         * @memberof lukuid
         * @classdesc Represents a SetAttestationRequest.
         * @implements ISetAttestationRequest
         * @constructor
         * @param {lukuid.ISetAttestationRequest=} [properties] Properties to set
         */
        function SetAttestationRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SetAttestationRequest dacDer.
         * @member {Uint8Array} dacDer
         * @memberof lukuid.SetAttestationRequest
         * @instance
         */
        SetAttestationRequest.prototype.dacDer = $util.newBuffer([]);

        /**
         * SetAttestationRequest manufacturerDer.
         * @member {Uint8Array} manufacturerDer
         * @memberof lukuid.SetAttestationRequest
         * @instance
         */
        SetAttestationRequest.prototype.manufacturerDer = $util.newBuffer([]);

        /**
         * SetAttestationRequest signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.SetAttestationRequest
         * @instance
         */
        SetAttestationRequest.prototype.signature = $util.newBuffer([]);

        /**
         * SetAttestationRequest counter.
         * @member {number|Long} counter
         * @memberof lukuid.SetAttestationRequest
         * @instance
         */
        SetAttestationRequest.prototype.counter = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * SetAttestationRequest nonce.
         * @member {string} nonce
         * @memberof lukuid.SetAttestationRequest
         * @instance
         */
        SetAttestationRequest.prototype.nonce = "";

        /**
         * SetAttestationRequest intermediateDer.
         * @member {Uint8Array} intermediateDer
         * @memberof lukuid.SetAttestationRequest
         * @instance
         */
        SetAttestationRequest.prototype.intermediateDer = $util.newBuffer([]);

        /**
         * Creates a new SetAttestationRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.SetAttestationRequest
         * @static
         * @param {lukuid.ISetAttestationRequest=} [properties] Properties to set
         * @returns {lukuid.SetAttestationRequest} SetAttestationRequest instance
         */
        SetAttestationRequest.create = function create(properties) {
            return new SetAttestationRequest(properties);
        };

        /**
         * Encodes the specified SetAttestationRequest message. Does not implicitly {@link lukuid.SetAttestationRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.SetAttestationRequest
         * @static
         * @param {lukuid.ISetAttestationRequest} message SetAttestationRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetAttestationRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.dacDer != null && Object.hasOwnProperty.call(message, "dacDer"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.dacDer);
            if (message.manufacturerDer != null && Object.hasOwnProperty.call(message, "manufacturerDer"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.manufacturerDer);
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.signature);
            if (message.counter != null && Object.hasOwnProperty.call(message, "counter"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.counter);
            if (message.nonce != null && Object.hasOwnProperty.call(message, "nonce"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.nonce);
            if (message.intermediateDer != null && Object.hasOwnProperty.call(message, "intermediateDer"))
                writer.uint32(/* id 6, wireType 2 =*/50).bytes(message.intermediateDer);
            return writer;
        };

        /**
         * Encodes the specified SetAttestationRequest message, length delimited. Does not implicitly {@link lukuid.SetAttestationRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.SetAttestationRequest
         * @static
         * @param {lukuid.ISetAttestationRequest} message SetAttestationRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetAttestationRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a SetAttestationRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.SetAttestationRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.SetAttestationRequest} SetAttestationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetAttestationRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.SetAttestationRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.dacDer = reader.bytes();
                        break;
                    }
                case 2: {
                        message.manufacturerDer = reader.bytes();
                        break;
                    }
                case 3: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 4: {
                        message.counter = reader.uint64();
                        break;
                    }
                case 5: {
                        message.nonce = reader.string();
                        break;
                    }
                case 6: {
                        message.intermediateDer = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a SetAttestationRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.SetAttestationRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.SetAttestationRequest} SetAttestationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetAttestationRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SetAttestationRequest message.
         * @function verify
         * @memberof lukuid.SetAttestationRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SetAttestationRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.dacDer != null && message.hasOwnProperty("dacDer"))
                if (!(message.dacDer && typeof message.dacDer.length === "number" || $util.isString(message.dacDer)))
                    return "dacDer: buffer expected";
            if (message.manufacturerDer != null && message.hasOwnProperty("manufacturerDer"))
                if (!(message.manufacturerDer && typeof message.manufacturerDer.length === "number" || $util.isString(message.manufacturerDer)))
                    return "manufacturerDer: buffer expected";
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            if (message.counter != null && message.hasOwnProperty("counter"))
                if (!$util.isInteger(message.counter) && !(message.counter && $util.isInteger(message.counter.low) && $util.isInteger(message.counter.high)))
                    return "counter: integer|Long expected";
            if (message.nonce != null && message.hasOwnProperty("nonce"))
                if (!$util.isString(message.nonce))
                    return "nonce: string expected";
            if (message.intermediateDer != null && message.hasOwnProperty("intermediateDer"))
                if (!(message.intermediateDer && typeof message.intermediateDer.length === "number" || $util.isString(message.intermediateDer)))
                    return "intermediateDer: buffer expected";
            return null;
        };

        /**
         * Creates a SetAttestationRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.SetAttestationRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.SetAttestationRequest} SetAttestationRequest
         */
        SetAttestationRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.SetAttestationRequest)
                return object;
            let message = new $root.lukuid.SetAttestationRequest();
            if (object.dacDer != null)
                if (typeof object.dacDer === "string")
                    $util.base64.decode(object.dacDer, message.dacDer = $util.newBuffer($util.base64.length(object.dacDer)), 0);
                else if (object.dacDer.length >= 0)
                    message.dacDer = object.dacDer;
            if (object.manufacturerDer != null)
                if (typeof object.manufacturerDer === "string")
                    $util.base64.decode(object.manufacturerDer, message.manufacturerDer = $util.newBuffer($util.base64.length(object.manufacturerDer)), 0);
                else if (object.manufacturerDer.length >= 0)
                    message.manufacturerDer = object.manufacturerDer;
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.counter != null)
                if ($util.Long)
                    (message.counter = $util.Long.fromValue(object.counter)).unsigned = true;
                else if (typeof object.counter === "string")
                    message.counter = parseInt(object.counter, 10);
                else if (typeof object.counter === "number")
                    message.counter = object.counter;
                else if (typeof object.counter === "object")
                    message.counter = new $util.LongBits(object.counter.low >>> 0, object.counter.high >>> 0).toNumber(true);
            if (object.nonce != null)
                message.nonce = String(object.nonce);
            if (object.intermediateDer != null)
                if (typeof object.intermediateDer === "string")
                    $util.base64.decode(object.intermediateDer, message.intermediateDer = $util.newBuffer($util.base64.length(object.intermediateDer)), 0);
                else if (object.intermediateDer.length >= 0)
                    message.intermediateDer = object.intermediateDer;
            return message;
        };

        /**
         * Creates a plain object from a SetAttestationRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.SetAttestationRequest
         * @static
         * @param {lukuid.SetAttestationRequest} message SetAttestationRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SetAttestationRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if (options.bytes === String)
                    object.dacDer = "";
                else {
                    object.dacDer = [];
                    if (options.bytes !== Array)
                        object.dacDer = $util.newBuffer(object.dacDer);
                }
                if (options.bytes === String)
                    object.manufacturerDer = "";
                else {
                    object.manufacturerDer = [];
                    if (options.bytes !== Array)
                        object.manufacturerDer = $util.newBuffer(object.manufacturerDer);
                }
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.counter = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.counter = options.longs === String ? "0" : 0;
                object.nonce = "";
                if (options.bytes === String)
                    object.intermediateDer = "";
                else {
                    object.intermediateDer = [];
                    if (options.bytes !== Array)
                        object.intermediateDer = $util.newBuffer(object.intermediateDer);
                }
            }
            if (message.dacDer != null && message.hasOwnProperty("dacDer"))
                object.dacDer = options.bytes === String ? $util.base64.encode(message.dacDer, 0, message.dacDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.dacDer) : message.dacDer;
            if (message.manufacturerDer != null && message.hasOwnProperty("manufacturerDer"))
                object.manufacturerDer = options.bytes === String ? $util.base64.encode(message.manufacturerDer, 0, message.manufacturerDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.manufacturerDer) : message.manufacturerDer;
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            if (message.counter != null && message.hasOwnProperty("counter"))
                if (typeof message.counter === "number")
                    object.counter = options.longs === String ? String(message.counter) : message.counter;
                else
                    object.counter = options.longs === String ? $util.Long.prototype.toString.call(message.counter) : options.longs === Number ? new $util.LongBits(message.counter.low >>> 0, message.counter.high >>> 0).toNumber(true) : message.counter;
            if (message.nonce != null && message.hasOwnProperty("nonce"))
                object.nonce = message.nonce;
            if (message.intermediateDer != null && message.hasOwnProperty("intermediateDer"))
                object.intermediateDer = options.bytes === String ? $util.base64.encode(message.intermediateDer, 0, message.intermediateDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.intermediateDer) : message.intermediateDer;
            return object;
        };

        /**
         * Converts this SetAttestationRequest to JSON.
         * @function toJSON
         * @memberof lukuid.SetAttestationRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SetAttestationRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for SetAttestationRequest
         * @function getTypeUrl
         * @memberof lukuid.SetAttestationRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SetAttestationRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.SetAttestationRequest";
        };

        return SetAttestationRequest;
    })();

    lukuid.SetHeartbeatRequest = (function() {

        /**
         * Properties of a SetHeartbeatRequest.
         * @memberof lukuid
         * @interface ISetHeartbeatRequest
         * @property {Uint8Array|null} [slacDer] SetHeartbeatRequest slacDer
         * @property {Uint8Array|null} [heartbeatDer] SetHeartbeatRequest heartbeatDer
         * @property {Uint8Array|null} [signature] SetHeartbeatRequest signature
         * @property {number|Long|null} [timestamp] SetHeartbeatRequest timestamp
         * @property {Uint8Array|null} [intermediateDer] SetHeartbeatRequest intermediateDer
         */

        /**
         * Constructs a new SetHeartbeatRequest.
         * @memberof lukuid
         * @classdesc Represents a SetHeartbeatRequest.
         * @implements ISetHeartbeatRequest
         * @constructor
         * @param {lukuid.ISetHeartbeatRequest=} [properties] Properties to set
         */
        function SetHeartbeatRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SetHeartbeatRequest slacDer.
         * @member {Uint8Array} slacDer
         * @memberof lukuid.SetHeartbeatRequest
         * @instance
         */
        SetHeartbeatRequest.prototype.slacDer = $util.newBuffer([]);

        /**
         * SetHeartbeatRequest heartbeatDer.
         * @member {Uint8Array} heartbeatDer
         * @memberof lukuid.SetHeartbeatRequest
         * @instance
         */
        SetHeartbeatRequest.prototype.heartbeatDer = $util.newBuffer([]);

        /**
         * SetHeartbeatRequest signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.SetHeartbeatRequest
         * @instance
         */
        SetHeartbeatRequest.prototype.signature = $util.newBuffer([]);

        /**
         * SetHeartbeatRequest timestamp.
         * @member {number|Long} timestamp
         * @memberof lukuid.SetHeartbeatRequest
         * @instance
         */
        SetHeartbeatRequest.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * SetHeartbeatRequest intermediateDer.
         * @member {Uint8Array} intermediateDer
         * @memberof lukuid.SetHeartbeatRequest
         * @instance
         */
        SetHeartbeatRequest.prototype.intermediateDer = $util.newBuffer([]);

        /**
         * Creates a new SetHeartbeatRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.SetHeartbeatRequest
         * @static
         * @param {lukuid.ISetHeartbeatRequest=} [properties] Properties to set
         * @returns {lukuid.SetHeartbeatRequest} SetHeartbeatRequest instance
         */
        SetHeartbeatRequest.create = function create(properties) {
            return new SetHeartbeatRequest(properties);
        };

        /**
         * Encodes the specified SetHeartbeatRequest message. Does not implicitly {@link lukuid.SetHeartbeatRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.SetHeartbeatRequest
         * @static
         * @param {lukuid.ISetHeartbeatRequest} message SetHeartbeatRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetHeartbeatRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.slacDer != null && Object.hasOwnProperty.call(message, "slacDer"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.slacDer);
            if (message.heartbeatDer != null && Object.hasOwnProperty.call(message, "heartbeatDer"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.heartbeatDer);
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.signature);
            if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
                writer.uint32(/* id 4, wireType 0 =*/32).int64(message.timestamp);
            if (message.intermediateDer != null && Object.hasOwnProperty.call(message, "intermediateDer"))
                writer.uint32(/* id 5, wireType 2 =*/42).bytes(message.intermediateDer);
            return writer;
        };

        /**
         * Encodes the specified SetHeartbeatRequest message, length delimited. Does not implicitly {@link lukuid.SetHeartbeatRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.SetHeartbeatRequest
         * @static
         * @param {lukuid.ISetHeartbeatRequest} message SetHeartbeatRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetHeartbeatRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a SetHeartbeatRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.SetHeartbeatRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.SetHeartbeatRequest} SetHeartbeatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetHeartbeatRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.SetHeartbeatRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.slacDer = reader.bytes();
                        break;
                    }
                case 2: {
                        message.heartbeatDer = reader.bytes();
                        break;
                    }
                case 3: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 4: {
                        message.timestamp = reader.int64();
                        break;
                    }
                case 5: {
                        message.intermediateDer = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a SetHeartbeatRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.SetHeartbeatRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.SetHeartbeatRequest} SetHeartbeatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetHeartbeatRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SetHeartbeatRequest message.
         * @function verify
         * @memberof lukuid.SetHeartbeatRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SetHeartbeatRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.slacDer != null && message.hasOwnProperty("slacDer"))
                if (!(message.slacDer && typeof message.slacDer.length === "number" || $util.isString(message.slacDer)))
                    return "slacDer: buffer expected";
            if (message.heartbeatDer != null && message.hasOwnProperty("heartbeatDer"))
                if (!(message.heartbeatDer && typeof message.heartbeatDer.length === "number" || $util.isString(message.heartbeatDer)))
                    return "heartbeatDer: buffer expected";
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                    return "timestamp: integer|Long expected";
            if (message.intermediateDer != null && message.hasOwnProperty("intermediateDer"))
                if (!(message.intermediateDer && typeof message.intermediateDer.length === "number" || $util.isString(message.intermediateDer)))
                    return "intermediateDer: buffer expected";
            return null;
        };

        /**
         * Creates a SetHeartbeatRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.SetHeartbeatRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.SetHeartbeatRequest} SetHeartbeatRequest
         */
        SetHeartbeatRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.SetHeartbeatRequest)
                return object;
            let message = new $root.lukuid.SetHeartbeatRequest();
            if (object.slacDer != null)
                if (typeof object.slacDer === "string")
                    $util.base64.decode(object.slacDer, message.slacDer = $util.newBuffer($util.base64.length(object.slacDer)), 0);
                else if (object.slacDer.length >= 0)
                    message.slacDer = object.slacDer;
            if (object.heartbeatDer != null)
                if (typeof object.heartbeatDer === "string")
                    $util.base64.decode(object.heartbeatDer, message.heartbeatDer = $util.newBuffer($util.base64.length(object.heartbeatDer)), 0);
                else if (object.heartbeatDer.length >= 0)
                    message.heartbeatDer = object.heartbeatDer;
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.timestamp != null)
                if ($util.Long)
                    (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = false;
                else if (typeof object.timestamp === "string")
                    message.timestamp = parseInt(object.timestamp, 10);
                else if (typeof object.timestamp === "number")
                    message.timestamp = object.timestamp;
                else if (typeof object.timestamp === "object")
                    message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
            if (object.intermediateDer != null)
                if (typeof object.intermediateDer === "string")
                    $util.base64.decode(object.intermediateDer, message.intermediateDer = $util.newBuffer($util.base64.length(object.intermediateDer)), 0);
                else if (object.intermediateDer.length >= 0)
                    message.intermediateDer = object.intermediateDer;
            return message;
        };

        /**
         * Creates a plain object from a SetHeartbeatRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.SetHeartbeatRequest
         * @static
         * @param {lukuid.SetHeartbeatRequest} message SetHeartbeatRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SetHeartbeatRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if (options.bytes === String)
                    object.slacDer = "";
                else {
                    object.slacDer = [];
                    if (options.bytes !== Array)
                        object.slacDer = $util.newBuffer(object.slacDer);
                }
                if (options.bytes === String)
                    object.heartbeatDer = "";
                else {
                    object.heartbeatDer = [];
                    if (options.bytes !== Array)
                        object.heartbeatDer = $util.newBuffer(object.heartbeatDer);
                }
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.timestamp = options.longs === String ? "0" : 0;
                if (options.bytes === String)
                    object.intermediateDer = "";
                else {
                    object.intermediateDer = [];
                    if (options.bytes !== Array)
                        object.intermediateDer = $util.newBuffer(object.intermediateDer);
                }
            }
            if (message.slacDer != null && message.hasOwnProperty("slacDer"))
                object.slacDer = options.bytes === String ? $util.base64.encode(message.slacDer, 0, message.slacDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.slacDer) : message.slacDer;
            if (message.heartbeatDer != null && message.hasOwnProperty("heartbeatDer"))
                object.heartbeatDer = options.bytes === String ? $util.base64.encode(message.heartbeatDer, 0, message.heartbeatDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.heartbeatDer) : message.heartbeatDer;
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                if (typeof message.timestamp === "number")
                    object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                else
                    object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber() : message.timestamp;
            if (message.intermediateDer != null && message.hasOwnProperty("intermediateDer"))
                object.intermediateDer = options.bytes === String ? $util.base64.encode(message.intermediateDer, 0, message.intermediateDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.intermediateDer) : message.intermediateDer;
            return object;
        };

        /**
         * Converts this SetHeartbeatRequest to JSON.
         * @function toJSON
         * @memberof lukuid.SetHeartbeatRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SetHeartbeatRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for SetHeartbeatRequest
         * @function getTypeUrl
         * @memberof lukuid.SetHeartbeatRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SetHeartbeatRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.SetHeartbeatRequest";
        };

        return SetHeartbeatRequest;
    })();

    lukuid.ScanEnableRequest = (function() {

        /**
         * Properties of a ScanEnableRequest.
         * @memberof lukuid
         * @interface IScanEnableRequest
         * @property {boolean|null} [enabled] ScanEnableRequest enabled
         */

        /**
         * Constructs a new ScanEnableRequest.
         * @memberof lukuid
         * @classdesc Represents a ScanEnableRequest.
         * @implements IScanEnableRequest
         * @constructor
         * @param {lukuid.IScanEnableRequest=} [properties] Properties to set
         */
        function ScanEnableRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ScanEnableRequest enabled.
         * @member {boolean} enabled
         * @memberof lukuid.ScanEnableRequest
         * @instance
         */
        ScanEnableRequest.prototype.enabled = false;

        /**
         * Creates a new ScanEnableRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.ScanEnableRequest
         * @static
         * @param {lukuid.IScanEnableRequest=} [properties] Properties to set
         * @returns {lukuid.ScanEnableRequest} ScanEnableRequest instance
         */
        ScanEnableRequest.create = function create(properties) {
            return new ScanEnableRequest(properties);
        };

        /**
         * Encodes the specified ScanEnableRequest message. Does not implicitly {@link lukuid.ScanEnableRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.ScanEnableRequest
         * @static
         * @param {lukuid.IScanEnableRequest} message ScanEnableRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ScanEnableRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.enabled != null && Object.hasOwnProperty.call(message, "enabled"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.enabled);
            return writer;
        };

        /**
         * Encodes the specified ScanEnableRequest message, length delimited. Does not implicitly {@link lukuid.ScanEnableRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.ScanEnableRequest
         * @static
         * @param {lukuid.IScanEnableRequest} message ScanEnableRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ScanEnableRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ScanEnableRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.ScanEnableRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.ScanEnableRequest} ScanEnableRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ScanEnableRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.ScanEnableRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.enabled = reader.bool();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ScanEnableRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.ScanEnableRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.ScanEnableRequest} ScanEnableRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ScanEnableRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ScanEnableRequest message.
         * @function verify
         * @memberof lukuid.ScanEnableRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ScanEnableRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.enabled != null && message.hasOwnProperty("enabled"))
                if (typeof message.enabled !== "boolean")
                    return "enabled: boolean expected";
            return null;
        };

        /**
         * Creates a ScanEnableRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.ScanEnableRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.ScanEnableRequest} ScanEnableRequest
         */
        ScanEnableRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.ScanEnableRequest)
                return object;
            let message = new $root.lukuid.ScanEnableRequest();
            if (object.enabled != null)
                message.enabled = Boolean(object.enabled);
            return message;
        };

        /**
         * Creates a plain object from a ScanEnableRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.ScanEnableRequest
         * @static
         * @param {lukuid.ScanEnableRequest} message ScanEnableRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ScanEnableRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.enabled = false;
            if (message.enabled != null && message.hasOwnProperty("enabled"))
                object.enabled = message.enabled;
            return object;
        };

        /**
         * Converts this ScanEnableRequest to JSON.
         * @function toJSON
         * @memberof lukuid.ScanEnableRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ScanEnableRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ScanEnableRequest
         * @function getTypeUrl
         * @memberof lukuid.ScanEnableRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ScanEnableRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.ScanEnableRequest";
        };

        return ScanEnableRequest;
    })();

    lukuid.GenerateHeartbeatRequest = (function() {

        /**
         * Properties of a GenerateHeartbeatRequest.
         * @memberof lukuid
         * @interface IGenerateHeartbeatRequest
         */

        /**
         * Constructs a new GenerateHeartbeatRequest.
         * @memberof lukuid
         * @classdesc Represents a GenerateHeartbeatRequest.
         * @implements IGenerateHeartbeatRequest
         * @constructor
         * @param {lukuid.IGenerateHeartbeatRequest=} [properties] Properties to set
         */
        function GenerateHeartbeatRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new GenerateHeartbeatRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.GenerateHeartbeatRequest
         * @static
         * @param {lukuid.IGenerateHeartbeatRequest=} [properties] Properties to set
         * @returns {lukuid.GenerateHeartbeatRequest} GenerateHeartbeatRequest instance
         */
        GenerateHeartbeatRequest.create = function create(properties) {
            return new GenerateHeartbeatRequest(properties);
        };

        /**
         * Encodes the specified GenerateHeartbeatRequest message. Does not implicitly {@link lukuid.GenerateHeartbeatRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.GenerateHeartbeatRequest
         * @static
         * @param {lukuid.IGenerateHeartbeatRequest} message GenerateHeartbeatRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GenerateHeartbeatRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified GenerateHeartbeatRequest message, length delimited. Does not implicitly {@link lukuid.GenerateHeartbeatRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.GenerateHeartbeatRequest
         * @static
         * @param {lukuid.IGenerateHeartbeatRequest} message GenerateHeartbeatRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GenerateHeartbeatRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GenerateHeartbeatRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.GenerateHeartbeatRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.GenerateHeartbeatRequest} GenerateHeartbeatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GenerateHeartbeatRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.GenerateHeartbeatRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GenerateHeartbeatRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.GenerateHeartbeatRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.GenerateHeartbeatRequest} GenerateHeartbeatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GenerateHeartbeatRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GenerateHeartbeatRequest message.
         * @function verify
         * @memberof lukuid.GenerateHeartbeatRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GenerateHeartbeatRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a GenerateHeartbeatRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.GenerateHeartbeatRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.GenerateHeartbeatRequest} GenerateHeartbeatRequest
         */
        GenerateHeartbeatRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.GenerateHeartbeatRequest)
                return object;
            return new $root.lukuid.GenerateHeartbeatRequest();
        };

        /**
         * Creates a plain object from a GenerateHeartbeatRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.GenerateHeartbeatRequest
         * @static
         * @param {lukuid.GenerateHeartbeatRequest} message GenerateHeartbeatRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GenerateHeartbeatRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this GenerateHeartbeatRequest to JSON.
         * @function toJSON
         * @memberof lukuid.GenerateHeartbeatRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GenerateHeartbeatRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GenerateHeartbeatRequest
         * @function getTypeUrl
         * @memberof lukuid.GenerateHeartbeatRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GenerateHeartbeatRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.GenerateHeartbeatRequest";
        };

        return GenerateHeartbeatRequest;
    })();

    lukuid.FetchTelemetryRequest = (function() {

        /**
         * Properties of a FetchTelemetryRequest.
         * @memberof lukuid
         * @interface IFetchTelemetryRequest
         */

        /**
         * Constructs a new FetchTelemetryRequest.
         * @memberof lukuid
         * @classdesc Represents a FetchTelemetryRequest.
         * @implements IFetchTelemetryRequest
         * @constructor
         * @param {lukuid.IFetchTelemetryRequest=} [properties] Properties to set
         */
        function FetchTelemetryRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new FetchTelemetryRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.FetchTelemetryRequest
         * @static
         * @param {lukuid.IFetchTelemetryRequest=} [properties] Properties to set
         * @returns {lukuid.FetchTelemetryRequest} FetchTelemetryRequest instance
         */
        FetchTelemetryRequest.create = function create(properties) {
            return new FetchTelemetryRequest(properties);
        };

        /**
         * Encodes the specified FetchTelemetryRequest message. Does not implicitly {@link lukuid.FetchTelemetryRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.FetchTelemetryRequest
         * @static
         * @param {lukuid.IFetchTelemetryRequest} message FetchTelemetryRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FetchTelemetryRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified FetchTelemetryRequest message, length delimited. Does not implicitly {@link lukuid.FetchTelemetryRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.FetchTelemetryRequest
         * @static
         * @param {lukuid.IFetchTelemetryRequest} message FetchTelemetryRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FetchTelemetryRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a FetchTelemetryRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.FetchTelemetryRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.FetchTelemetryRequest} FetchTelemetryRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FetchTelemetryRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.FetchTelemetryRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a FetchTelemetryRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.FetchTelemetryRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.FetchTelemetryRequest} FetchTelemetryRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FetchTelemetryRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a FetchTelemetryRequest message.
         * @function verify
         * @memberof lukuid.FetchTelemetryRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        FetchTelemetryRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a FetchTelemetryRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.FetchTelemetryRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.FetchTelemetryRequest} FetchTelemetryRequest
         */
        FetchTelemetryRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.FetchTelemetryRequest)
                return object;
            return new $root.lukuid.FetchTelemetryRequest();
        };

        /**
         * Creates a plain object from a FetchTelemetryRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.FetchTelemetryRequest
         * @static
         * @param {lukuid.FetchTelemetryRequest} message FetchTelemetryRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        FetchTelemetryRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this FetchTelemetryRequest to JSON.
         * @function toJSON
         * @memberof lukuid.FetchTelemetryRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        FetchTelemetryRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for FetchTelemetryRequest
         * @function getTypeUrl
         * @memberof lukuid.FetchTelemetryRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FetchTelemetryRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.FetchTelemetryRequest";
        };

        return FetchTelemetryRequest;
    })();

    lukuid.TelemetryValue = (function() {

        /**
         * Properties of a TelemetryValue.
         * @memberof lukuid
         * @interface ITelemetryValue
         * @property {number|null} [fval] TelemetryValue fval
         * @property {string|null} [sval] TelemetryValue sval
         * @property {number|Long|null} [ival] TelemetryValue ival
         * @property {boolean|null} [bval] TelemetryValue bval
         */

        /**
         * Constructs a new TelemetryValue.
         * @memberof lukuid
         * @classdesc Represents a TelemetryValue.
         * @implements ITelemetryValue
         * @constructor
         * @param {lukuid.ITelemetryValue=} [properties] Properties to set
         */
        function TelemetryValue(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * TelemetryValue fval.
         * @member {number|null|undefined} fval
         * @memberof lukuid.TelemetryValue
         * @instance
         */
        TelemetryValue.prototype.fval = null;

        /**
         * TelemetryValue sval.
         * @member {string|null|undefined} sval
         * @memberof lukuid.TelemetryValue
         * @instance
         */
        TelemetryValue.prototype.sval = null;

        /**
         * TelemetryValue ival.
         * @member {number|Long|null|undefined} ival
         * @memberof lukuid.TelemetryValue
         * @instance
         */
        TelemetryValue.prototype.ival = null;

        /**
         * TelemetryValue bval.
         * @member {boolean|null|undefined} bval
         * @memberof lukuid.TelemetryValue
         * @instance
         */
        TelemetryValue.prototype.bval = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * TelemetryValue kind.
         * @member {"fval"|"sval"|"ival"|"bval"|undefined} kind
         * @memberof lukuid.TelemetryValue
         * @instance
         */
        Object.defineProperty(TelemetryValue.prototype, "kind", {
            get: $util.oneOfGetter($oneOfFields = ["fval", "sval", "ival", "bval"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new TelemetryValue instance using the specified properties.
         * @function create
         * @memberof lukuid.TelemetryValue
         * @static
         * @param {lukuid.ITelemetryValue=} [properties] Properties to set
         * @returns {lukuid.TelemetryValue} TelemetryValue instance
         */
        TelemetryValue.create = function create(properties) {
            return new TelemetryValue(properties);
        };

        /**
         * Encodes the specified TelemetryValue message. Does not implicitly {@link lukuid.TelemetryValue.verify|verify} messages.
         * @function encode
         * @memberof lukuid.TelemetryValue
         * @static
         * @param {lukuid.ITelemetryValue} message TelemetryValue message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TelemetryValue.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.fval != null && Object.hasOwnProperty.call(message, "fval"))
                writer.uint32(/* id 1, wireType 5 =*/13).float(message.fval);
            if (message.sval != null && Object.hasOwnProperty.call(message, "sval"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.sval);
            if (message.ival != null && Object.hasOwnProperty.call(message, "ival"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.ival);
            if (message.bval != null && Object.hasOwnProperty.call(message, "bval"))
                writer.uint32(/* id 4, wireType 0 =*/32).bool(message.bval);
            return writer;
        };

        /**
         * Encodes the specified TelemetryValue message, length delimited. Does not implicitly {@link lukuid.TelemetryValue.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.TelemetryValue
         * @static
         * @param {lukuid.ITelemetryValue} message TelemetryValue message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TelemetryValue.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a TelemetryValue message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.TelemetryValue
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.TelemetryValue} TelemetryValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TelemetryValue.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.TelemetryValue();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.fval = reader.float();
                        break;
                    }
                case 2: {
                        message.sval = reader.string();
                        break;
                    }
                case 3: {
                        message.ival = reader.int64();
                        break;
                    }
                case 4: {
                        message.bval = reader.bool();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a TelemetryValue message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.TelemetryValue
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.TelemetryValue} TelemetryValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TelemetryValue.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a TelemetryValue message.
         * @function verify
         * @memberof lukuid.TelemetryValue
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        TelemetryValue.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.fval != null && message.hasOwnProperty("fval")) {
                properties.kind = 1;
                if (typeof message.fval !== "number")
                    return "fval: number expected";
            }
            if (message.sval != null && message.hasOwnProperty("sval")) {
                if (properties.kind === 1)
                    return "kind: multiple values";
                properties.kind = 1;
                if (!$util.isString(message.sval))
                    return "sval: string expected";
            }
            if (message.ival != null && message.hasOwnProperty("ival")) {
                if (properties.kind === 1)
                    return "kind: multiple values";
                properties.kind = 1;
                if (!$util.isInteger(message.ival) && !(message.ival && $util.isInteger(message.ival.low) && $util.isInteger(message.ival.high)))
                    return "ival: integer|Long expected";
            }
            if (message.bval != null && message.hasOwnProperty("bval")) {
                if (properties.kind === 1)
                    return "kind: multiple values";
                properties.kind = 1;
                if (typeof message.bval !== "boolean")
                    return "bval: boolean expected";
            }
            return null;
        };

        /**
         * Creates a TelemetryValue message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.TelemetryValue
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.TelemetryValue} TelemetryValue
         */
        TelemetryValue.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.TelemetryValue)
                return object;
            let message = new $root.lukuid.TelemetryValue();
            if (object.fval != null)
                message.fval = Number(object.fval);
            if (object.sval != null)
                message.sval = String(object.sval);
            if (object.ival != null)
                if ($util.Long)
                    (message.ival = $util.Long.fromValue(object.ival)).unsigned = false;
                else if (typeof object.ival === "string")
                    message.ival = parseInt(object.ival, 10);
                else if (typeof object.ival === "number")
                    message.ival = object.ival;
                else if (typeof object.ival === "object")
                    message.ival = new $util.LongBits(object.ival.low >>> 0, object.ival.high >>> 0).toNumber();
            if (object.bval != null)
                message.bval = Boolean(object.bval);
            return message;
        };

        /**
         * Creates a plain object from a TelemetryValue message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.TelemetryValue
         * @static
         * @param {lukuid.TelemetryValue} message TelemetryValue
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        TelemetryValue.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (message.fval != null && message.hasOwnProperty("fval")) {
                object.fval = options.json && !isFinite(message.fval) ? String(message.fval) : message.fval;
                if (options.oneofs)
                    object.kind = "fval";
            }
            if (message.sval != null && message.hasOwnProperty("sval")) {
                object.sval = message.sval;
                if (options.oneofs)
                    object.kind = "sval";
            }
            if (message.ival != null && message.hasOwnProperty("ival")) {
                if (typeof message.ival === "number")
                    object.ival = options.longs === String ? String(message.ival) : message.ival;
                else
                    object.ival = options.longs === String ? $util.Long.prototype.toString.call(message.ival) : options.longs === Number ? new $util.LongBits(message.ival.low >>> 0, message.ival.high >>> 0).toNumber() : message.ival;
                if (options.oneofs)
                    object.kind = "ival";
            }
            if (message.bval != null && message.hasOwnProperty("bval")) {
                object.bval = message.bval;
                if (options.oneofs)
                    object.kind = "bval";
            }
            return object;
        };

        /**
         * Converts this TelemetryValue to JSON.
         * @function toJSON
         * @memberof lukuid.TelemetryValue
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        TelemetryValue.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for TelemetryValue
         * @function getTypeUrl
         * @memberof lukuid.TelemetryValue
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TelemetryValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.TelemetryValue";
        };

        return TelemetryValue;
    })();

    lukuid.TelemetryRow = (function() {

        /**
         * Properties of a TelemetryRow.
         * @memberof lukuid
         * @interface ITelemetryRow
         * @property {Array.<lukuid.ITelemetryValue>|null} [values] TelemetryRow values
         */

        /**
         * Constructs a new TelemetryRow.
         * @memberof lukuid
         * @classdesc Represents a TelemetryRow.
         * @implements ITelemetryRow
         * @constructor
         * @param {lukuid.ITelemetryRow=} [properties] Properties to set
         */
        function TelemetryRow(properties) {
            this.values = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * TelemetryRow values.
         * @member {Array.<lukuid.ITelemetryValue>} values
         * @memberof lukuid.TelemetryRow
         * @instance
         */
        TelemetryRow.prototype.values = $util.emptyArray;

        /**
         * Creates a new TelemetryRow instance using the specified properties.
         * @function create
         * @memberof lukuid.TelemetryRow
         * @static
         * @param {lukuid.ITelemetryRow=} [properties] Properties to set
         * @returns {lukuid.TelemetryRow} TelemetryRow instance
         */
        TelemetryRow.create = function create(properties) {
            return new TelemetryRow(properties);
        };

        /**
         * Encodes the specified TelemetryRow message. Does not implicitly {@link lukuid.TelemetryRow.verify|verify} messages.
         * @function encode
         * @memberof lukuid.TelemetryRow
         * @static
         * @param {lukuid.ITelemetryRow} message TelemetryRow message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TelemetryRow.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.values != null && message.values.length)
                for (let i = 0; i < message.values.length; ++i)
                    $root.lukuid.TelemetryValue.encode(message.values[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified TelemetryRow message, length delimited. Does not implicitly {@link lukuid.TelemetryRow.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.TelemetryRow
         * @static
         * @param {lukuid.ITelemetryRow} message TelemetryRow message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TelemetryRow.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a TelemetryRow message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.TelemetryRow
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.TelemetryRow} TelemetryRow
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TelemetryRow.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.TelemetryRow();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.values && message.values.length))
                            message.values = [];
                        message.values.push($root.lukuid.TelemetryValue.decode(reader, reader.uint32()));
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a TelemetryRow message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.TelemetryRow
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.TelemetryRow} TelemetryRow
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TelemetryRow.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a TelemetryRow message.
         * @function verify
         * @memberof lukuid.TelemetryRow
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        TelemetryRow.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.values != null && message.hasOwnProperty("values")) {
                if (!Array.isArray(message.values))
                    return "values: array expected";
                for (let i = 0; i < message.values.length; ++i) {
                    let error = $root.lukuid.TelemetryValue.verify(message.values[i]);
                    if (error)
                        return "values." + error;
                }
            }
            return null;
        };

        /**
         * Creates a TelemetryRow message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.TelemetryRow
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.TelemetryRow} TelemetryRow
         */
        TelemetryRow.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.TelemetryRow)
                return object;
            let message = new $root.lukuid.TelemetryRow();
            if (object.values) {
                if (!Array.isArray(object.values))
                    throw TypeError(".lukuid.TelemetryRow.values: array expected");
                message.values = [];
                for (let i = 0; i < object.values.length; ++i) {
                    if (typeof object.values[i] !== "object")
                        throw TypeError(".lukuid.TelemetryRow.values: object expected");
                    message.values[i] = $root.lukuid.TelemetryValue.fromObject(object.values[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a TelemetryRow message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.TelemetryRow
         * @static
         * @param {lukuid.TelemetryRow} message TelemetryRow
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        TelemetryRow.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.values = [];
            if (message.values && message.values.length) {
                object.values = [];
                for (let j = 0; j < message.values.length; ++j)
                    object.values[j] = $root.lukuid.TelemetryValue.toObject(message.values[j], options);
            }
            return object;
        };

        /**
         * Converts this TelemetryRow to JSON.
         * @function toJSON
         * @memberof lukuid.TelemetryRow
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        TelemetryRow.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for TelemetryRow
         * @function getTypeUrl
         * @memberof lukuid.TelemetryRow
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TelemetryRow.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.TelemetryRow";
        };

        return TelemetryRow;
    })();

    lukuid.FetchTelemetryResponse = (function() {

        /**
         * Properties of a FetchTelemetryResponse.
         * @memberof lukuid
         * @interface IFetchTelemetryResponse
         * @property {Array.<lukuid.ITelemetryRow>|null} [rows] FetchTelemetryResponse rows
         * @property {Uint8Array|null} [signature] FetchTelemetryResponse signature
         * @property {string|null} [canonicalString] FetchTelemetryResponse canonicalString
         */

        /**
         * Constructs a new FetchTelemetryResponse.
         * @memberof lukuid
         * @classdesc Represents a FetchTelemetryResponse.
         * @implements IFetchTelemetryResponse
         * @constructor
         * @param {lukuid.IFetchTelemetryResponse=} [properties] Properties to set
         */
        function FetchTelemetryResponse(properties) {
            this.rows = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * FetchTelemetryResponse rows.
         * @member {Array.<lukuid.ITelemetryRow>} rows
         * @memberof lukuid.FetchTelemetryResponse
         * @instance
         */
        FetchTelemetryResponse.prototype.rows = $util.emptyArray;

        /**
         * FetchTelemetryResponse signature.
         * @member {Uint8Array|null|undefined} signature
         * @memberof lukuid.FetchTelemetryResponse
         * @instance
         */
        FetchTelemetryResponse.prototype.signature = null;

        /**
         * FetchTelemetryResponse canonicalString.
         * @member {string|null|undefined} canonicalString
         * @memberof lukuid.FetchTelemetryResponse
         * @instance
         */
        FetchTelemetryResponse.prototype.canonicalString = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(FetchTelemetryResponse.prototype, "_signature", {
            get: $util.oneOfGetter($oneOfFields = ["signature"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(FetchTelemetryResponse.prototype, "_canonicalString", {
            get: $util.oneOfGetter($oneOfFields = ["canonicalString"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new FetchTelemetryResponse instance using the specified properties.
         * @function create
         * @memberof lukuid.FetchTelemetryResponse
         * @static
         * @param {lukuid.IFetchTelemetryResponse=} [properties] Properties to set
         * @returns {lukuid.FetchTelemetryResponse} FetchTelemetryResponse instance
         */
        FetchTelemetryResponse.create = function create(properties) {
            return new FetchTelemetryResponse(properties);
        };

        /**
         * Encodes the specified FetchTelemetryResponse message. Does not implicitly {@link lukuid.FetchTelemetryResponse.verify|verify} messages.
         * @function encode
         * @memberof lukuid.FetchTelemetryResponse
         * @static
         * @param {lukuid.IFetchTelemetryResponse} message FetchTelemetryResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FetchTelemetryResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.rows != null && message.rows.length)
                for (let i = 0; i < message.rows.length; ++i)
                    $root.lukuid.TelemetryRow.encode(message.rows[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.signature);
            if (message.canonicalString != null && Object.hasOwnProperty.call(message, "canonicalString"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.canonicalString);
            return writer;
        };

        /**
         * Encodes the specified FetchTelemetryResponse message, length delimited. Does not implicitly {@link lukuid.FetchTelemetryResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.FetchTelemetryResponse
         * @static
         * @param {lukuid.IFetchTelemetryResponse} message FetchTelemetryResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FetchTelemetryResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a FetchTelemetryResponse message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.FetchTelemetryResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.FetchTelemetryResponse} FetchTelemetryResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FetchTelemetryResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.FetchTelemetryResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.rows && message.rows.length))
                            message.rows = [];
                        message.rows.push($root.lukuid.TelemetryRow.decode(reader, reader.uint32()));
                        break;
                    }
                case 2: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 3: {
                        message.canonicalString = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a FetchTelemetryResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.FetchTelemetryResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.FetchTelemetryResponse} FetchTelemetryResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FetchTelemetryResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a FetchTelemetryResponse message.
         * @function verify
         * @memberof lukuid.FetchTelemetryResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        FetchTelemetryResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.rows != null && message.hasOwnProperty("rows")) {
                if (!Array.isArray(message.rows))
                    return "rows: array expected";
                for (let i = 0; i < message.rows.length; ++i) {
                    let error = $root.lukuid.TelemetryRow.verify(message.rows[i]);
                    if (error)
                        return "rows." + error;
                }
            }
            if (message.signature != null && message.hasOwnProperty("signature")) {
                properties._signature = 1;
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            }
            if (message.canonicalString != null && message.hasOwnProperty("canonicalString")) {
                properties._canonicalString = 1;
                if (!$util.isString(message.canonicalString))
                    return "canonicalString: string expected";
            }
            return null;
        };

        /**
         * Creates a FetchTelemetryResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.FetchTelemetryResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.FetchTelemetryResponse} FetchTelemetryResponse
         */
        FetchTelemetryResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.FetchTelemetryResponse)
                return object;
            let message = new $root.lukuid.FetchTelemetryResponse();
            if (object.rows) {
                if (!Array.isArray(object.rows))
                    throw TypeError(".lukuid.FetchTelemetryResponse.rows: array expected");
                message.rows = [];
                for (let i = 0; i < object.rows.length; ++i) {
                    if (typeof object.rows[i] !== "object")
                        throw TypeError(".lukuid.FetchTelemetryResponse.rows: object expected");
                    message.rows[i] = $root.lukuid.TelemetryRow.fromObject(object.rows[i]);
                }
            }
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.canonicalString != null)
                message.canonicalString = String(object.canonicalString);
            return message;
        };

        /**
         * Creates a plain object from a FetchTelemetryResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.FetchTelemetryResponse
         * @static
         * @param {lukuid.FetchTelemetryResponse} message FetchTelemetryResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        FetchTelemetryResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.rows = [];
            if (message.rows && message.rows.length) {
                object.rows = [];
                for (let j = 0; j < message.rows.length; ++j)
                    object.rows[j] = $root.lukuid.TelemetryRow.toObject(message.rows[j], options);
            }
            if (message.signature != null && message.hasOwnProperty("signature")) {
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
                if (options.oneofs)
                    object._signature = "signature";
            }
            if (message.canonicalString != null && message.hasOwnProperty("canonicalString")) {
                object.canonicalString = message.canonicalString;
                if (options.oneofs)
                    object._canonicalString = "canonicalString";
            }
            return object;
        };

        /**
         * Converts this FetchTelemetryResponse to JSON.
         * @function toJSON
         * @memberof lukuid.FetchTelemetryResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        FetchTelemetryResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for FetchTelemetryResponse
         * @function getTypeUrl
         * @memberof lukuid.FetchTelemetryResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FetchTelemetryResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.FetchTelemetryResponse";
        };

        return FetchTelemetryResponse;
    })();

    lukuid.CommandRequest = (function() {

        /**
         * Properties of a CommandRequest.
         * @memberof lukuid
         * @interface ICommandRequest
         * @property {string|null} [action] CommandRequest action
         * @property {lukuid.IFetchRequest|null} [fetch] CommandRequest fetch
         * @property {lukuid.IGetRecordRequest|null} [get] CommandRequest get
         * @property {lukuid.IAttestRequest|null} [attest] CommandRequest attest
         * @property {lukuid.IConfigRequest|null} [config] CommandRequest config
         * @property {lukuid.IOtaBeginRequest|null} [otaBegin] CommandRequest otaBegin
         * @property {lukuid.IOtaDataRequest|null} [otaData] CommandRequest otaData
         * @property {lukuid.IOtaEndRequest|null} [otaDataV2] CommandRequest otaDataV2
         * @property {lukuid.ISetAttestationRequest|null} [setAttestation] CommandRequest setAttestation
         * @property {lukuid.ISetHeartbeatRequest|null} [setHeartbeat] CommandRequest setHeartbeat
         * @property {lukuid.IScanEnableRequest|null} [scanEnable] CommandRequest scanEnable
         * @property {lukuid.IGenerateHeartbeatRequest|null} [generateHeartbeat] CommandRequest generateHeartbeat
         * @property {lukuid.IFetchTelemetryRequest|null} [fetchTelemetry] CommandRequest fetchTelemetry
         */

        /**
         * Constructs a new CommandRequest.
         * @memberof lukuid
         * @classdesc Represents a CommandRequest.
         * @implements ICommandRequest
         * @constructor
         * @param {lukuid.ICommandRequest=} [properties] Properties to set
         */
        function CommandRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * CommandRequest action.
         * @member {string} action
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.action = "";

        /**
         * CommandRequest fetch.
         * @member {lukuid.IFetchRequest|null|undefined} fetch
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.fetch = null;

        /**
         * CommandRequest get.
         * @member {lukuid.IGetRecordRequest|null|undefined} get
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.get = null;

        /**
         * CommandRequest attest.
         * @member {lukuid.IAttestRequest|null|undefined} attest
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.attest = null;

        /**
         * CommandRequest config.
         * @member {lukuid.IConfigRequest|null|undefined} config
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.config = null;

        /**
         * CommandRequest otaBegin.
         * @member {lukuid.IOtaBeginRequest|null|undefined} otaBegin
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.otaBegin = null;

        /**
         * CommandRequest otaData.
         * @member {lukuid.IOtaDataRequest|null|undefined} otaData
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.otaData = null;

        /**
         * CommandRequest otaDataV2.
         * @member {lukuid.IOtaEndRequest|null|undefined} otaDataV2
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.otaDataV2 = null;

        /**
         * CommandRequest setAttestation.
         * @member {lukuid.ISetAttestationRequest|null|undefined} setAttestation
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.setAttestation = null;

        /**
         * CommandRequest setHeartbeat.
         * @member {lukuid.ISetHeartbeatRequest|null|undefined} setHeartbeat
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.setHeartbeat = null;

        /**
         * CommandRequest scanEnable.
         * @member {lukuid.IScanEnableRequest|null|undefined} scanEnable
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.scanEnable = null;

        /**
         * CommandRequest generateHeartbeat.
         * @member {lukuid.IGenerateHeartbeatRequest|null|undefined} generateHeartbeat
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.generateHeartbeat = null;

        /**
         * CommandRequest fetchTelemetry.
         * @member {lukuid.IFetchTelemetryRequest|null|undefined} fetchTelemetry
         * @memberof lukuid.CommandRequest
         * @instance
         */
        CommandRequest.prototype.fetchTelemetry = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * CommandRequest payload.
         * @member {"fetch"|"get"|"attest"|"config"|"otaBegin"|"otaData"|"otaDataV2"|"setAttestation"|"setHeartbeat"|"scanEnable"|"generateHeartbeat"|"fetchTelemetry"|undefined} payload
         * @memberof lukuid.CommandRequest
         * @instance
         */
        Object.defineProperty(CommandRequest.prototype, "payload", {
            get: $util.oneOfGetter($oneOfFields = ["fetch", "get", "attest", "config", "otaBegin", "otaData", "otaDataV2", "setAttestation", "setHeartbeat", "scanEnable", "generateHeartbeat", "fetchTelemetry"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new CommandRequest instance using the specified properties.
         * @function create
         * @memberof lukuid.CommandRequest
         * @static
         * @param {lukuid.ICommandRequest=} [properties] Properties to set
         * @returns {lukuid.CommandRequest} CommandRequest instance
         */
        CommandRequest.create = function create(properties) {
            return new CommandRequest(properties);
        };

        /**
         * Encodes the specified CommandRequest message. Does not implicitly {@link lukuid.CommandRequest.verify|verify} messages.
         * @function encode
         * @memberof lukuid.CommandRequest
         * @static
         * @param {lukuid.ICommandRequest} message CommandRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CommandRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.action != null && Object.hasOwnProperty.call(message, "action"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.action);
            if (message.fetch != null && Object.hasOwnProperty.call(message, "fetch"))
                $root.lukuid.FetchRequest.encode(message.fetch, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.get != null && Object.hasOwnProperty.call(message, "get"))
                $root.lukuid.GetRecordRequest.encode(message.get, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.attest != null && Object.hasOwnProperty.call(message, "attest"))
                $root.lukuid.AttestRequest.encode(message.attest, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            if (message.config != null && Object.hasOwnProperty.call(message, "config"))
                $root.lukuid.ConfigRequest.encode(message.config, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.otaBegin != null && Object.hasOwnProperty.call(message, "otaBegin"))
                $root.lukuid.OtaBeginRequest.encode(message.otaBegin, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.otaData != null && Object.hasOwnProperty.call(message, "otaData"))
                $root.lukuid.OtaDataRequest.encode(message.otaData, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            if (message.otaDataV2 != null && Object.hasOwnProperty.call(message, "otaDataV2"))
                $root.lukuid.OtaEndRequest.encode(message.otaDataV2, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
            if (message.setAttestation != null && Object.hasOwnProperty.call(message, "setAttestation"))
                $root.lukuid.SetAttestationRequest.encode(message.setAttestation, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
            if (message.setHeartbeat != null && Object.hasOwnProperty.call(message, "setHeartbeat"))
                $root.lukuid.SetHeartbeatRequest.encode(message.setHeartbeat, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
            if (message.scanEnable != null && Object.hasOwnProperty.call(message, "scanEnable"))
                $root.lukuid.ScanEnableRequest.encode(message.scanEnable, writer.uint32(/* id 12, wireType 2 =*/98).fork()).ldelim();
            if (message.generateHeartbeat != null && Object.hasOwnProperty.call(message, "generateHeartbeat"))
                $root.lukuid.GenerateHeartbeatRequest.encode(message.generateHeartbeat, writer.uint32(/* id 13, wireType 2 =*/106).fork()).ldelim();
            if (message.fetchTelemetry != null && Object.hasOwnProperty.call(message, "fetchTelemetry"))
                $root.lukuid.FetchTelemetryRequest.encode(message.fetchTelemetry, writer.uint32(/* id 14, wireType 2 =*/114).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified CommandRequest message, length delimited. Does not implicitly {@link lukuid.CommandRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.CommandRequest
         * @static
         * @param {lukuid.ICommandRequest} message CommandRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CommandRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a CommandRequest message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.CommandRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.CommandRequest} CommandRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CommandRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.CommandRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.action = reader.string();
                        break;
                    }
                case 2: {
                        message.fetch = $root.lukuid.FetchRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 3: {
                        message.get = $root.lukuid.GetRecordRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 4: {
                        message.attest = $root.lukuid.AttestRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 5: {
                        message.config = $root.lukuid.ConfigRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 6: {
                        message.otaBegin = $root.lukuid.OtaBeginRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 7: {
                        message.otaData = $root.lukuid.OtaDataRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 8: {
                        message.otaDataV2 = $root.lukuid.OtaEndRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 9: {
                        message.setAttestation = $root.lukuid.SetAttestationRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 10: {
                        message.setHeartbeat = $root.lukuid.SetHeartbeatRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 12: {
                        message.scanEnable = $root.lukuid.ScanEnableRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 13: {
                        message.generateHeartbeat = $root.lukuid.GenerateHeartbeatRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 14: {
                        message.fetchTelemetry = $root.lukuid.FetchTelemetryRequest.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a CommandRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.CommandRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.CommandRequest} CommandRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CommandRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a CommandRequest message.
         * @function verify
         * @memberof lukuid.CommandRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        CommandRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.action != null && message.hasOwnProperty("action"))
                if (!$util.isString(message.action))
                    return "action: string expected";
            if (message.fetch != null && message.hasOwnProperty("fetch")) {
                properties.payload = 1;
                {
                    let error = $root.lukuid.FetchRequest.verify(message.fetch);
                    if (error)
                        return "fetch." + error;
                }
            }
            if (message.get != null && message.hasOwnProperty("get")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.GetRecordRequest.verify(message.get);
                    if (error)
                        return "get." + error;
                }
            }
            if (message.attest != null && message.hasOwnProperty("attest")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.AttestRequest.verify(message.attest);
                    if (error)
                        return "attest." + error;
                }
            }
            if (message.config != null && message.hasOwnProperty("config")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.ConfigRequest.verify(message.config);
                    if (error)
                        return "config." + error;
                }
            }
            if (message.otaBegin != null && message.hasOwnProperty("otaBegin")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.OtaBeginRequest.verify(message.otaBegin);
                    if (error)
                        return "otaBegin." + error;
                }
            }
            if (message.otaData != null && message.hasOwnProperty("otaData")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.OtaDataRequest.verify(message.otaData);
                    if (error)
                        return "otaData." + error;
                }
            }
            if (message.otaDataV2 != null && message.hasOwnProperty("otaDataV2")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.OtaEndRequest.verify(message.otaDataV2);
                    if (error)
                        return "otaDataV2." + error;
                }
            }
            if (message.setAttestation != null && message.hasOwnProperty("setAttestation")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.SetAttestationRequest.verify(message.setAttestation);
                    if (error)
                        return "setAttestation." + error;
                }
            }
            if (message.setHeartbeat != null && message.hasOwnProperty("setHeartbeat")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.SetHeartbeatRequest.verify(message.setHeartbeat);
                    if (error)
                        return "setHeartbeat." + error;
                }
            }
            if (message.scanEnable != null && message.hasOwnProperty("scanEnable")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.ScanEnableRequest.verify(message.scanEnable);
                    if (error)
                        return "scanEnable." + error;
                }
            }
            if (message.generateHeartbeat != null && message.hasOwnProperty("generateHeartbeat")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.GenerateHeartbeatRequest.verify(message.generateHeartbeat);
                    if (error)
                        return "generateHeartbeat." + error;
                }
            }
            if (message.fetchTelemetry != null && message.hasOwnProperty("fetchTelemetry")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.FetchTelemetryRequest.verify(message.fetchTelemetry);
                    if (error)
                        return "fetchTelemetry." + error;
                }
            }
            return null;
        };

        /**
         * Creates a CommandRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.CommandRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.CommandRequest} CommandRequest
         */
        CommandRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.CommandRequest)
                return object;
            let message = new $root.lukuid.CommandRequest();
            if (object.action != null)
                message.action = String(object.action);
            if (object.fetch != null) {
                if (typeof object.fetch !== "object")
                    throw TypeError(".lukuid.CommandRequest.fetch: object expected");
                message.fetch = $root.lukuid.FetchRequest.fromObject(object.fetch);
            }
            if (object.get != null) {
                if (typeof object.get !== "object")
                    throw TypeError(".lukuid.CommandRequest.get: object expected");
                message.get = $root.lukuid.GetRecordRequest.fromObject(object.get);
            }
            if (object.attest != null) {
                if (typeof object.attest !== "object")
                    throw TypeError(".lukuid.CommandRequest.attest: object expected");
                message.attest = $root.lukuid.AttestRequest.fromObject(object.attest);
            }
            if (object.config != null) {
                if (typeof object.config !== "object")
                    throw TypeError(".lukuid.CommandRequest.config: object expected");
                message.config = $root.lukuid.ConfigRequest.fromObject(object.config);
            }
            if (object.otaBegin != null) {
                if (typeof object.otaBegin !== "object")
                    throw TypeError(".lukuid.CommandRequest.otaBegin: object expected");
                message.otaBegin = $root.lukuid.OtaBeginRequest.fromObject(object.otaBegin);
            }
            if (object.otaData != null) {
                if (typeof object.otaData !== "object")
                    throw TypeError(".lukuid.CommandRequest.otaData: object expected");
                message.otaData = $root.lukuid.OtaDataRequest.fromObject(object.otaData);
            }
            if (object.otaDataV2 != null) {
                if (typeof object.otaDataV2 !== "object")
                    throw TypeError(".lukuid.CommandRequest.otaDataV2: object expected");
                message.otaDataV2 = $root.lukuid.OtaEndRequest.fromObject(object.otaDataV2);
            }
            if (object.setAttestation != null) {
                if (typeof object.setAttestation !== "object")
                    throw TypeError(".lukuid.CommandRequest.setAttestation: object expected");
                message.setAttestation = $root.lukuid.SetAttestationRequest.fromObject(object.setAttestation);
            }
            if (object.setHeartbeat != null) {
                if (typeof object.setHeartbeat !== "object")
                    throw TypeError(".lukuid.CommandRequest.setHeartbeat: object expected");
                message.setHeartbeat = $root.lukuid.SetHeartbeatRequest.fromObject(object.setHeartbeat);
            }
            if (object.scanEnable != null) {
                if (typeof object.scanEnable !== "object")
                    throw TypeError(".lukuid.CommandRequest.scanEnable: object expected");
                message.scanEnable = $root.lukuid.ScanEnableRequest.fromObject(object.scanEnable);
            }
            if (object.generateHeartbeat != null) {
                if (typeof object.generateHeartbeat !== "object")
                    throw TypeError(".lukuid.CommandRequest.generateHeartbeat: object expected");
                message.generateHeartbeat = $root.lukuid.GenerateHeartbeatRequest.fromObject(object.generateHeartbeat);
            }
            if (object.fetchTelemetry != null) {
                if (typeof object.fetchTelemetry !== "object")
                    throw TypeError(".lukuid.CommandRequest.fetchTelemetry: object expected");
                message.fetchTelemetry = $root.lukuid.FetchTelemetryRequest.fromObject(object.fetchTelemetry);
            }
            return message;
        };

        /**
         * Creates a plain object from a CommandRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.CommandRequest
         * @static
         * @param {lukuid.CommandRequest} message CommandRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        CommandRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.action = "";
            if (message.action != null && message.hasOwnProperty("action"))
                object.action = message.action;
            if (message.fetch != null && message.hasOwnProperty("fetch")) {
                object.fetch = $root.lukuid.FetchRequest.toObject(message.fetch, options);
                if (options.oneofs)
                    object.payload = "fetch";
            }
            if (message.get != null && message.hasOwnProperty("get")) {
                object.get = $root.lukuid.GetRecordRequest.toObject(message.get, options);
                if (options.oneofs)
                    object.payload = "get";
            }
            if (message.attest != null && message.hasOwnProperty("attest")) {
                object.attest = $root.lukuid.AttestRequest.toObject(message.attest, options);
                if (options.oneofs)
                    object.payload = "attest";
            }
            if (message.config != null && message.hasOwnProperty("config")) {
                object.config = $root.lukuid.ConfigRequest.toObject(message.config, options);
                if (options.oneofs)
                    object.payload = "config";
            }
            if (message.otaBegin != null && message.hasOwnProperty("otaBegin")) {
                object.otaBegin = $root.lukuid.OtaBeginRequest.toObject(message.otaBegin, options);
                if (options.oneofs)
                    object.payload = "otaBegin";
            }
            if (message.otaData != null && message.hasOwnProperty("otaData")) {
                object.otaData = $root.lukuid.OtaDataRequest.toObject(message.otaData, options);
                if (options.oneofs)
                    object.payload = "otaData";
            }
            if (message.otaDataV2 != null && message.hasOwnProperty("otaDataV2")) {
                object.otaDataV2 = $root.lukuid.OtaEndRequest.toObject(message.otaDataV2, options);
                if (options.oneofs)
                    object.payload = "otaDataV2";
            }
            if (message.setAttestation != null && message.hasOwnProperty("setAttestation")) {
                object.setAttestation = $root.lukuid.SetAttestationRequest.toObject(message.setAttestation, options);
                if (options.oneofs)
                    object.payload = "setAttestation";
            }
            if (message.setHeartbeat != null && message.hasOwnProperty("setHeartbeat")) {
                object.setHeartbeat = $root.lukuid.SetHeartbeatRequest.toObject(message.setHeartbeat, options);
                if (options.oneofs)
                    object.payload = "setHeartbeat";
            }
            if (message.scanEnable != null && message.hasOwnProperty("scanEnable")) {
                object.scanEnable = $root.lukuid.ScanEnableRequest.toObject(message.scanEnable, options);
                if (options.oneofs)
                    object.payload = "scanEnable";
            }
            if (message.generateHeartbeat != null && message.hasOwnProperty("generateHeartbeat")) {
                object.generateHeartbeat = $root.lukuid.GenerateHeartbeatRequest.toObject(message.generateHeartbeat, options);
                if (options.oneofs)
                    object.payload = "generateHeartbeat";
            }
            if (message.fetchTelemetry != null && message.hasOwnProperty("fetchTelemetry")) {
                object.fetchTelemetry = $root.lukuid.FetchTelemetryRequest.toObject(message.fetchTelemetry, options);
                if (options.oneofs)
                    object.payload = "fetchTelemetry";
            }
            return object;
        };

        /**
         * Converts this CommandRequest to JSON.
         * @function toJSON
         * @memberof lukuid.CommandRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        CommandRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for CommandRequest
         * @function getTypeUrl
         * @memberof lukuid.CommandRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        CommandRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.CommandRequest";
        };

        return CommandRequest;
    })();

    lukuid.DeviceInfoResponse = (function() {

        /**
         * Properties of a DeviceInfoResponse.
         * @memberof lukuid
         * @interface IDeviceInfoResponse
         * @property {string|null} [handshake] DeviceInfoResponse handshake
         * @property {number|Long|null} [uptimeMs] DeviceInfoResponse uptimeMs
         * @property {Uint8Array|null} [token] DeviceInfoResponse token
         * @property {number|null} [battery] DeviceInfoResponse battery
         * @property {number|null} [voltage] DeviceInfoResponse voltage
         * @property {boolean|null} [vbus] DeviceInfoResponse vbus
         * @property {number|null} [counter] DeviceInfoResponse counter
         * @property {boolean|null} [syncRequired] DeviceInfoResponse syncRequired
         * @property {string|null} [name] DeviceInfoResponse name
         * @property {string|null} [id] DeviceInfoResponse id
         * @property {string|null} [product] DeviceInfoResponse product
         * @property {string|null} [model] DeviceInfoResponse model
         * @property {string|null} [firmware] DeviceInfoResponse firmware
         * @property {string|null} [revision] DeviceInfoResponse revision
         * @property {boolean|null} [pairing] DeviceInfoResponse pairing
         * @property {string|null} [customHeartbeatUrl] DeviceInfoResponse customHeartbeatUrl
         * @property {boolean|null} [telemetry] DeviceInfoResponse telemetry
         * @property {string|null} [managedBy] DeviceInfoResponse managedBy
         * @property {Uint8Array|null} [attestationDacDer] DeviceInfoResponse attestationDacDer
         * @property {Uint8Array|null} [attestationManufacturerDer] DeviceInfoResponse attestationManufacturerDer
         * @property {Uint8Array|null} [attestationIntermediateDer] DeviceInfoResponse attestationIntermediateDer
         * @property {string|null} [attestationRootFingerprint] DeviceInfoResponse attestationRootFingerprint
         * @property {Uint8Array|null} [heartbeatSlacDer] DeviceInfoResponse heartbeatSlacDer
         * @property {Uint8Array|null} [heartbeatDer] DeviceInfoResponse heartbeatDer
         * @property {Uint8Array|null} [heartbeatIntermediateDer] DeviceInfoResponse heartbeatIntermediateDer
         * @property {string|null} [heartbeatRootFingerprint] DeviceInfoResponse heartbeatRootFingerprint
         * @property {Uint8Array|null} [signature] DeviceInfoResponse signature
         * @property {Uint8Array|null} [key] DeviceInfoResponse key
         */

        /**
         * Constructs a new DeviceInfoResponse.
         * @memberof lukuid
         * @classdesc Represents a DeviceInfoResponse.
         * @implements IDeviceInfoResponse
         * @constructor
         * @param {lukuid.IDeviceInfoResponse=} [properties] Properties to set
         */
        function DeviceInfoResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * DeviceInfoResponse handshake.
         * @member {string} handshake
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.handshake = "";

        /**
         * DeviceInfoResponse uptimeMs.
         * @member {number|Long} uptimeMs
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.uptimeMs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * DeviceInfoResponse token.
         * @member {Uint8Array} token
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.token = $util.newBuffer([]);

        /**
         * DeviceInfoResponse battery.
         * @member {number} battery
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.battery = 0;

        /**
         * DeviceInfoResponse voltage.
         * @member {number} voltage
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.voltage = 0;

        /**
         * DeviceInfoResponse vbus.
         * @member {boolean} vbus
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.vbus = false;

        /**
         * DeviceInfoResponse counter.
         * @member {number} counter
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.counter = 0;

        /**
         * DeviceInfoResponse syncRequired.
         * @member {boolean} syncRequired
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.syncRequired = false;

        /**
         * DeviceInfoResponse name.
         * @member {string} name
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.name = "";

        /**
         * DeviceInfoResponse id.
         * @member {string} id
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.id = "";

        /**
         * DeviceInfoResponse product.
         * @member {string} product
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.product = "";

        /**
         * DeviceInfoResponse model.
         * @member {string} model
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.model = "";

        /**
         * DeviceInfoResponse firmware.
         * @member {string} firmware
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.firmware = "";

        /**
         * DeviceInfoResponse revision.
         * @member {string} revision
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.revision = "";

        /**
         * DeviceInfoResponse pairing.
         * @member {boolean} pairing
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.pairing = false;

        /**
         * DeviceInfoResponse customHeartbeatUrl.
         * @member {string} customHeartbeatUrl
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.customHeartbeatUrl = "";

        /**
         * DeviceInfoResponse telemetry.
         * @member {boolean} telemetry
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.telemetry = false;

        /**
         * DeviceInfoResponse managedBy.
         * @member {string} managedBy
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.managedBy = "";

        /**
         * DeviceInfoResponse attestationDacDer.
         * @member {Uint8Array} attestationDacDer
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.attestationDacDer = $util.newBuffer([]);

        /**
         * DeviceInfoResponse attestationManufacturerDer.
         * @member {Uint8Array} attestationManufacturerDer
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.attestationManufacturerDer = $util.newBuffer([]);

        /**
         * DeviceInfoResponse attestationIntermediateDer.
         * @member {Uint8Array} attestationIntermediateDer
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.attestationIntermediateDer = $util.newBuffer([]);

        /**
         * DeviceInfoResponse attestationRootFingerprint.
         * @member {string} attestationRootFingerprint
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.attestationRootFingerprint = "";

        /**
         * DeviceInfoResponse heartbeatSlacDer.
         * @member {Uint8Array} heartbeatSlacDer
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.heartbeatSlacDer = $util.newBuffer([]);

        /**
         * DeviceInfoResponse heartbeatDer.
         * @member {Uint8Array} heartbeatDer
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.heartbeatDer = $util.newBuffer([]);

        /**
         * DeviceInfoResponse heartbeatIntermediateDer.
         * @member {Uint8Array} heartbeatIntermediateDer
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.heartbeatIntermediateDer = $util.newBuffer([]);

        /**
         * DeviceInfoResponse heartbeatRootFingerprint.
         * @member {string} heartbeatRootFingerprint
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.heartbeatRootFingerprint = "";

        /**
         * DeviceInfoResponse signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.signature = $util.newBuffer([]);

        /**
         * DeviceInfoResponse key.
         * @member {Uint8Array} key
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         */
        DeviceInfoResponse.prototype.key = $util.newBuffer([]);

        /**
         * Creates a new DeviceInfoResponse instance using the specified properties.
         * @function create
         * @memberof lukuid.DeviceInfoResponse
         * @static
         * @param {lukuid.IDeviceInfoResponse=} [properties] Properties to set
         * @returns {lukuid.DeviceInfoResponse} DeviceInfoResponse instance
         */
        DeviceInfoResponse.create = function create(properties) {
            return new DeviceInfoResponse(properties);
        };

        /**
         * Encodes the specified DeviceInfoResponse message. Does not implicitly {@link lukuid.DeviceInfoResponse.verify|verify} messages.
         * @function encode
         * @memberof lukuid.DeviceInfoResponse
         * @static
         * @param {lukuid.IDeviceInfoResponse} message DeviceInfoResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DeviceInfoResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.handshake != null && Object.hasOwnProperty.call(message, "handshake"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.handshake);
            if (message.uptimeMs != null && Object.hasOwnProperty.call(message, "uptimeMs"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.uptimeMs);
            if (message.token != null && Object.hasOwnProperty.call(message, "token"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.token);
            if (message.battery != null && Object.hasOwnProperty.call(message, "battery"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.battery);
            if (message.voltage != null && Object.hasOwnProperty.call(message, "voltage"))
                writer.uint32(/* id 5, wireType 5 =*/45).float(message.voltage);
            if (message.vbus != null && Object.hasOwnProperty.call(message, "vbus"))
                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.vbus);
            if (message.counter != null && Object.hasOwnProperty.call(message, "counter"))
                writer.uint32(/* id 7, wireType 1 =*/57).double(message.counter);
            if (message.syncRequired != null && Object.hasOwnProperty.call(message, "syncRequired"))
                writer.uint32(/* id 8, wireType 0 =*/64).bool(message.syncRequired);
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.name);
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.id);
            if (message.product != null && Object.hasOwnProperty.call(message, "product"))
                writer.uint32(/* id 11, wireType 2 =*/90).string(message.product);
            if (message.model != null && Object.hasOwnProperty.call(message, "model"))
                writer.uint32(/* id 12, wireType 2 =*/98).string(message.model);
            if (message.firmware != null && Object.hasOwnProperty.call(message, "firmware"))
                writer.uint32(/* id 13, wireType 2 =*/106).string(message.firmware);
            if (message.revision != null && Object.hasOwnProperty.call(message, "revision"))
                writer.uint32(/* id 14, wireType 2 =*/114).string(message.revision);
            if (message.pairing != null && Object.hasOwnProperty.call(message, "pairing"))
                writer.uint32(/* id 15, wireType 0 =*/120).bool(message.pairing);
            if (message.customHeartbeatUrl != null && Object.hasOwnProperty.call(message, "customHeartbeatUrl"))
                writer.uint32(/* id 16, wireType 2 =*/130).string(message.customHeartbeatUrl);
            if (message.telemetry != null && Object.hasOwnProperty.call(message, "telemetry"))
                writer.uint32(/* id 17, wireType 0 =*/136).bool(message.telemetry);
            if (message.managedBy != null && Object.hasOwnProperty.call(message, "managedBy"))
                writer.uint32(/* id 18, wireType 2 =*/146).string(message.managedBy);
            if (message.attestationDacDer != null && Object.hasOwnProperty.call(message, "attestationDacDer"))
                writer.uint32(/* id 19, wireType 2 =*/154).bytes(message.attestationDacDer);
            if (message.attestationManufacturerDer != null && Object.hasOwnProperty.call(message, "attestationManufacturerDer"))
                writer.uint32(/* id 20, wireType 2 =*/162).bytes(message.attestationManufacturerDer);
            if (message.attestationIntermediateDer != null && Object.hasOwnProperty.call(message, "attestationIntermediateDer"))
                writer.uint32(/* id 21, wireType 2 =*/170).bytes(message.attestationIntermediateDer);
            if (message.attestationRootFingerprint != null && Object.hasOwnProperty.call(message, "attestationRootFingerprint"))
                writer.uint32(/* id 22, wireType 2 =*/178).string(message.attestationRootFingerprint);
            if (message.heartbeatSlacDer != null && Object.hasOwnProperty.call(message, "heartbeatSlacDer"))
                writer.uint32(/* id 23, wireType 2 =*/186).bytes(message.heartbeatSlacDer);
            if (message.heartbeatDer != null && Object.hasOwnProperty.call(message, "heartbeatDer"))
                writer.uint32(/* id 24, wireType 2 =*/194).bytes(message.heartbeatDer);
            if (message.heartbeatIntermediateDer != null && Object.hasOwnProperty.call(message, "heartbeatIntermediateDer"))
                writer.uint32(/* id 25, wireType 2 =*/202).bytes(message.heartbeatIntermediateDer);
            if (message.heartbeatRootFingerprint != null && Object.hasOwnProperty.call(message, "heartbeatRootFingerprint"))
                writer.uint32(/* id 26, wireType 2 =*/210).string(message.heartbeatRootFingerprint);
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 27, wireType 2 =*/218).bytes(message.signature);
            if (message.key != null && Object.hasOwnProperty.call(message, "key"))
                writer.uint32(/* id 28, wireType 2 =*/226).bytes(message.key);
            return writer;
        };

        /**
         * Encodes the specified DeviceInfoResponse message, length delimited. Does not implicitly {@link lukuid.DeviceInfoResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.DeviceInfoResponse
         * @static
         * @param {lukuid.IDeviceInfoResponse} message DeviceInfoResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DeviceInfoResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a DeviceInfoResponse message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.DeviceInfoResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.DeviceInfoResponse} DeviceInfoResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DeviceInfoResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.DeviceInfoResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.handshake = reader.string();
                        break;
                    }
                case 2: {
                        message.uptimeMs = reader.int64();
                        break;
                    }
                case 3: {
                        message.token = reader.bytes();
                        break;
                    }
                case 4: {
                        message.battery = reader.float();
                        break;
                    }
                case 5: {
                        message.voltage = reader.float();
                        break;
                    }
                case 6: {
                        message.vbus = reader.bool();
                        break;
                    }
                case 7: {
                        message.counter = reader.double();
                        break;
                    }
                case 8: {
                        message.syncRequired = reader.bool();
                        break;
                    }
                case 9: {
                        message.name = reader.string();
                        break;
                    }
                case 10: {
                        message.id = reader.string();
                        break;
                    }
                case 11: {
                        message.product = reader.string();
                        break;
                    }
                case 12: {
                        message.model = reader.string();
                        break;
                    }
                case 13: {
                        message.firmware = reader.string();
                        break;
                    }
                case 14: {
                        message.revision = reader.string();
                        break;
                    }
                case 15: {
                        message.pairing = reader.bool();
                        break;
                    }
                case 16: {
                        message.customHeartbeatUrl = reader.string();
                        break;
                    }
                case 17: {
                        message.telemetry = reader.bool();
                        break;
                    }
                case 18: {
                        message.managedBy = reader.string();
                        break;
                    }
                case 19: {
                        message.attestationDacDer = reader.bytes();
                        break;
                    }
                case 20: {
                        message.attestationManufacturerDer = reader.bytes();
                        break;
                    }
                case 21: {
                        message.attestationIntermediateDer = reader.bytes();
                        break;
                    }
                case 22: {
                        message.attestationRootFingerprint = reader.string();
                        break;
                    }
                case 23: {
                        message.heartbeatSlacDer = reader.bytes();
                        break;
                    }
                case 24: {
                        message.heartbeatDer = reader.bytes();
                        break;
                    }
                case 25: {
                        message.heartbeatIntermediateDer = reader.bytes();
                        break;
                    }
                case 26: {
                        message.heartbeatRootFingerprint = reader.string();
                        break;
                    }
                case 27: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 28: {
                        message.key = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a DeviceInfoResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.DeviceInfoResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.DeviceInfoResponse} DeviceInfoResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DeviceInfoResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a DeviceInfoResponse message.
         * @function verify
         * @memberof lukuid.DeviceInfoResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        DeviceInfoResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.handshake != null && message.hasOwnProperty("handshake"))
                if (!$util.isString(message.handshake))
                    return "handshake: string expected";
            if (message.uptimeMs != null && message.hasOwnProperty("uptimeMs"))
                if (!$util.isInteger(message.uptimeMs) && !(message.uptimeMs && $util.isInteger(message.uptimeMs.low) && $util.isInteger(message.uptimeMs.high)))
                    return "uptimeMs: integer|Long expected";
            if (message.token != null && message.hasOwnProperty("token"))
                if (!(message.token && typeof message.token.length === "number" || $util.isString(message.token)))
                    return "token: buffer expected";
            if (message.battery != null && message.hasOwnProperty("battery"))
                if (typeof message.battery !== "number")
                    return "battery: number expected";
            if (message.voltage != null && message.hasOwnProperty("voltage"))
                if (typeof message.voltage !== "number")
                    return "voltage: number expected";
            if (message.vbus != null && message.hasOwnProperty("vbus"))
                if (typeof message.vbus !== "boolean")
                    return "vbus: boolean expected";
            if (message.counter != null && message.hasOwnProperty("counter"))
                if (typeof message.counter !== "number")
                    return "counter: number expected";
            if (message.syncRequired != null && message.hasOwnProperty("syncRequired"))
                if (typeof message.syncRequired !== "boolean")
                    return "syncRequired: boolean expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.product != null && message.hasOwnProperty("product"))
                if (!$util.isString(message.product))
                    return "product: string expected";
            if (message.model != null && message.hasOwnProperty("model"))
                if (!$util.isString(message.model))
                    return "model: string expected";
            if (message.firmware != null && message.hasOwnProperty("firmware"))
                if (!$util.isString(message.firmware))
                    return "firmware: string expected";
            if (message.revision != null && message.hasOwnProperty("revision"))
                if (!$util.isString(message.revision))
                    return "revision: string expected";
            if (message.pairing != null && message.hasOwnProperty("pairing"))
                if (typeof message.pairing !== "boolean")
                    return "pairing: boolean expected";
            if (message.customHeartbeatUrl != null && message.hasOwnProperty("customHeartbeatUrl"))
                if (!$util.isString(message.customHeartbeatUrl))
                    return "customHeartbeatUrl: string expected";
            if (message.telemetry != null && message.hasOwnProperty("telemetry"))
                if (typeof message.telemetry !== "boolean")
                    return "telemetry: boolean expected";
            if (message.managedBy != null && message.hasOwnProperty("managedBy"))
                if (!$util.isString(message.managedBy))
                    return "managedBy: string expected";
            if (message.attestationDacDer != null && message.hasOwnProperty("attestationDacDer"))
                if (!(message.attestationDacDer && typeof message.attestationDacDer.length === "number" || $util.isString(message.attestationDacDer)))
                    return "attestationDacDer: buffer expected";
            if (message.attestationManufacturerDer != null && message.hasOwnProperty("attestationManufacturerDer"))
                if (!(message.attestationManufacturerDer && typeof message.attestationManufacturerDer.length === "number" || $util.isString(message.attestationManufacturerDer)))
                    return "attestationManufacturerDer: buffer expected";
            if (message.attestationIntermediateDer != null && message.hasOwnProperty("attestationIntermediateDer"))
                if (!(message.attestationIntermediateDer && typeof message.attestationIntermediateDer.length === "number" || $util.isString(message.attestationIntermediateDer)))
                    return "attestationIntermediateDer: buffer expected";
            if (message.attestationRootFingerprint != null && message.hasOwnProperty("attestationRootFingerprint"))
                if (!$util.isString(message.attestationRootFingerprint))
                    return "attestationRootFingerprint: string expected";
            if (message.heartbeatSlacDer != null && message.hasOwnProperty("heartbeatSlacDer"))
                if (!(message.heartbeatSlacDer && typeof message.heartbeatSlacDer.length === "number" || $util.isString(message.heartbeatSlacDer)))
                    return "heartbeatSlacDer: buffer expected";
            if (message.heartbeatDer != null && message.hasOwnProperty("heartbeatDer"))
                if (!(message.heartbeatDer && typeof message.heartbeatDer.length === "number" || $util.isString(message.heartbeatDer)))
                    return "heartbeatDer: buffer expected";
            if (message.heartbeatIntermediateDer != null && message.hasOwnProperty("heartbeatIntermediateDer"))
                if (!(message.heartbeatIntermediateDer && typeof message.heartbeatIntermediateDer.length === "number" || $util.isString(message.heartbeatIntermediateDer)))
                    return "heartbeatIntermediateDer: buffer expected";
            if (message.heartbeatRootFingerprint != null && message.hasOwnProperty("heartbeatRootFingerprint"))
                if (!$util.isString(message.heartbeatRootFingerprint))
                    return "heartbeatRootFingerprint: string expected";
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            if (message.key != null && message.hasOwnProperty("key"))
                if (!(message.key && typeof message.key.length === "number" || $util.isString(message.key)))
                    return "key: buffer expected";
            return null;
        };

        /**
         * Creates a DeviceInfoResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.DeviceInfoResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.DeviceInfoResponse} DeviceInfoResponse
         */
        DeviceInfoResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.DeviceInfoResponse)
                return object;
            let message = new $root.lukuid.DeviceInfoResponse();
            if (object.handshake != null)
                message.handshake = String(object.handshake);
            if (object.uptimeMs != null)
                if ($util.Long)
                    (message.uptimeMs = $util.Long.fromValue(object.uptimeMs)).unsigned = false;
                else if (typeof object.uptimeMs === "string")
                    message.uptimeMs = parseInt(object.uptimeMs, 10);
                else if (typeof object.uptimeMs === "number")
                    message.uptimeMs = object.uptimeMs;
                else if (typeof object.uptimeMs === "object")
                    message.uptimeMs = new $util.LongBits(object.uptimeMs.low >>> 0, object.uptimeMs.high >>> 0).toNumber();
            if (object.token != null)
                if (typeof object.token === "string")
                    $util.base64.decode(object.token, message.token = $util.newBuffer($util.base64.length(object.token)), 0);
                else if (object.token.length >= 0)
                    message.token = object.token;
            if (object.battery != null)
                message.battery = Number(object.battery);
            if (object.voltage != null)
                message.voltage = Number(object.voltage);
            if (object.vbus != null)
                message.vbus = Boolean(object.vbus);
            if (object.counter != null)
                message.counter = Number(object.counter);
            if (object.syncRequired != null)
                message.syncRequired = Boolean(object.syncRequired);
            if (object.name != null)
                message.name = String(object.name);
            if (object.id != null)
                message.id = String(object.id);
            if (object.product != null)
                message.product = String(object.product);
            if (object.model != null)
                message.model = String(object.model);
            if (object.firmware != null)
                message.firmware = String(object.firmware);
            if (object.revision != null)
                message.revision = String(object.revision);
            if (object.pairing != null)
                message.pairing = Boolean(object.pairing);
            if (object.customHeartbeatUrl != null)
                message.customHeartbeatUrl = String(object.customHeartbeatUrl);
            if (object.telemetry != null)
                message.telemetry = Boolean(object.telemetry);
            if (object.managedBy != null)
                message.managedBy = String(object.managedBy);
            if (object.attestationDacDer != null)
                if (typeof object.attestationDacDer === "string")
                    $util.base64.decode(object.attestationDacDer, message.attestationDacDer = $util.newBuffer($util.base64.length(object.attestationDacDer)), 0);
                else if (object.attestationDacDer.length >= 0)
                    message.attestationDacDer = object.attestationDacDer;
            if (object.attestationManufacturerDer != null)
                if (typeof object.attestationManufacturerDer === "string")
                    $util.base64.decode(object.attestationManufacturerDer, message.attestationManufacturerDer = $util.newBuffer($util.base64.length(object.attestationManufacturerDer)), 0);
                else if (object.attestationManufacturerDer.length >= 0)
                    message.attestationManufacturerDer = object.attestationManufacturerDer;
            if (object.attestationIntermediateDer != null)
                if (typeof object.attestationIntermediateDer === "string")
                    $util.base64.decode(object.attestationIntermediateDer, message.attestationIntermediateDer = $util.newBuffer($util.base64.length(object.attestationIntermediateDer)), 0);
                else if (object.attestationIntermediateDer.length >= 0)
                    message.attestationIntermediateDer = object.attestationIntermediateDer;
            if (object.attestationRootFingerprint != null)
                message.attestationRootFingerprint = String(object.attestationRootFingerprint);
            if (object.heartbeatSlacDer != null)
                if (typeof object.heartbeatSlacDer === "string")
                    $util.base64.decode(object.heartbeatSlacDer, message.heartbeatSlacDer = $util.newBuffer($util.base64.length(object.heartbeatSlacDer)), 0);
                else if (object.heartbeatSlacDer.length >= 0)
                    message.heartbeatSlacDer = object.heartbeatSlacDer;
            if (object.heartbeatDer != null)
                if (typeof object.heartbeatDer === "string")
                    $util.base64.decode(object.heartbeatDer, message.heartbeatDer = $util.newBuffer($util.base64.length(object.heartbeatDer)), 0);
                else if (object.heartbeatDer.length >= 0)
                    message.heartbeatDer = object.heartbeatDer;
            if (object.heartbeatIntermediateDer != null)
                if (typeof object.heartbeatIntermediateDer === "string")
                    $util.base64.decode(object.heartbeatIntermediateDer, message.heartbeatIntermediateDer = $util.newBuffer($util.base64.length(object.heartbeatIntermediateDer)), 0);
                else if (object.heartbeatIntermediateDer.length >= 0)
                    message.heartbeatIntermediateDer = object.heartbeatIntermediateDer;
            if (object.heartbeatRootFingerprint != null)
                message.heartbeatRootFingerprint = String(object.heartbeatRootFingerprint);
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.key != null)
                if (typeof object.key === "string")
                    $util.base64.decode(object.key, message.key = $util.newBuffer($util.base64.length(object.key)), 0);
                else if (object.key.length >= 0)
                    message.key = object.key;
            return message;
        };

        /**
         * Creates a plain object from a DeviceInfoResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.DeviceInfoResponse
         * @static
         * @param {lukuid.DeviceInfoResponse} message DeviceInfoResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        DeviceInfoResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.handshake = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.uptimeMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.uptimeMs = options.longs === String ? "0" : 0;
                if (options.bytes === String)
                    object.token = "";
                else {
                    object.token = [];
                    if (options.bytes !== Array)
                        object.token = $util.newBuffer(object.token);
                }
                object.battery = 0;
                object.voltage = 0;
                object.vbus = false;
                object.counter = 0;
                object.syncRequired = false;
                object.name = "";
                object.id = "";
                object.product = "";
                object.model = "";
                object.firmware = "";
                object.revision = "";
                object.pairing = false;
                object.customHeartbeatUrl = "";
                object.telemetry = false;
                object.managedBy = "";
                if (options.bytes === String)
                    object.attestationDacDer = "";
                else {
                    object.attestationDacDer = [];
                    if (options.bytes !== Array)
                        object.attestationDacDer = $util.newBuffer(object.attestationDacDer);
                }
                if (options.bytes === String)
                    object.attestationManufacturerDer = "";
                else {
                    object.attestationManufacturerDer = [];
                    if (options.bytes !== Array)
                        object.attestationManufacturerDer = $util.newBuffer(object.attestationManufacturerDer);
                }
                if (options.bytes === String)
                    object.attestationIntermediateDer = "";
                else {
                    object.attestationIntermediateDer = [];
                    if (options.bytes !== Array)
                        object.attestationIntermediateDer = $util.newBuffer(object.attestationIntermediateDer);
                }
                object.attestationRootFingerprint = "";
                if (options.bytes === String)
                    object.heartbeatSlacDer = "";
                else {
                    object.heartbeatSlacDer = [];
                    if (options.bytes !== Array)
                        object.heartbeatSlacDer = $util.newBuffer(object.heartbeatSlacDer);
                }
                if (options.bytes === String)
                    object.heartbeatDer = "";
                else {
                    object.heartbeatDer = [];
                    if (options.bytes !== Array)
                        object.heartbeatDer = $util.newBuffer(object.heartbeatDer);
                }
                if (options.bytes === String)
                    object.heartbeatIntermediateDer = "";
                else {
                    object.heartbeatIntermediateDer = [];
                    if (options.bytes !== Array)
                        object.heartbeatIntermediateDer = $util.newBuffer(object.heartbeatIntermediateDer);
                }
                object.heartbeatRootFingerprint = "";
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
                if (options.bytes === String)
                    object.key = "";
                else {
                    object.key = [];
                    if (options.bytes !== Array)
                        object.key = $util.newBuffer(object.key);
                }
            }
            if (message.handshake != null && message.hasOwnProperty("handshake"))
                object.handshake = message.handshake;
            if (message.uptimeMs != null && message.hasOwnProperty("uptimeMs"))
                if (typeof message.uptimeMs === "number")
                    object.uptimeMs = options.longs === String ? String(message.uptimeMs) : message.uptimeMs;
                else
                    object.uptimeMs = options.longs === String ? $util.Long.prototype.toString.call(message.uptimeMs) : options.longs === Number ? new $util.LongBits(message.uptimeMs.low >>> 0, message.uptimeMs.high >>> 0).toNumber() : message.uptimeMs;
            if (message.token != null && message.hasOwnProperty("token"))
                object.token = options.bytes === String ? $util.base64.encode(message.token, 0, message.token.length) : options.bytes === Array ? Array.prototype.slice.call(message.token) : message.token;
            if (message.battery != null && message.hasOwnProperty("battery"))
                object.battery = options.json && !isFinite(message.battery) ? String(message.battery) : message.battery;
            if (message.voltage != null && message.hasOwnProperty("voltage"))
                object.voltage = options.json && !isFinite(message.voltage) ? String(message.voltage) : message.voltage;
            if (message.vbus != null && message.hasOwnProperty("vbus"))
                object.vbus = message.vbus;
            if (message.counter != null && message.hasOwnProperty("counter"))
                object.counter = options.json && !isFinite(message.counter) ? String(message.counter) : message.counter;
            if (message.syncRequired != null && message.hasOwnProperty("syncRequired"))
                object.syncRequired = message.syncRequired;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.product != null && message.hasOwnProperty("product"))
                object.product = message.product;
            if (message.model != null && message.hasOwnProperty("model"))
                object.model = message.model;
            if (message.firmware != null && message.hasOwnProperty("firmware"))
                object.firmware = message.firmware;
            if (message.revision != null && message.hasOwnProperty("revision"))
                object.revision = message.revision;
            if (message.pairing != null && message.hasOwnProperty("pairing"))
                object.pairing = message.pairing;
            if (message.customHeartbeatUrl != null && message.hasOwnProperty("customHeartbeatUrl"))
                object.customHeartbeatUrl = message.customHeartbeatUrl;
            if (message.telemetry != null && message.hasOwnProperty("telemetry"))
                object.telemetry = message.telemetry;
            if (message.managedBy != null && message.hasOwnProperty("managedBy"))
                object.managedBy = message.managedBy;
            if (message.attestationDacDer != null && message.hasOwnProperty("attestationDacDer"))
                object.attestationDacDer = options.bytes === String ? $util.base64.encode(message.attestationDacDer, 0, message.attestationDacDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.attestationDacDer) : message.attestationDacDer;
            if (message.attestationManufacturerDer != null && message.hasOwnProperty("attestationManufacturerDer"))
                object.attestationManufacturerDer = options.bytes === String ? $util.base64.encode(message.attestationManufacturerDer, 0, message.attestationManufacturerDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.attestationManufacturerDer) : message.attestationManufacturerDer;
            if (message.attestationIntermediateDer != null && message.hasOwnProperty("attestationIntermediateDer"))
                object.attestationIntermediateDer = options.bytes === String ? $util.base64.encode(message.attestationIntermediateDer, 0, message.attestationIntermediateDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.attestationIntermediateDer) : message.attestationIntermediateDer;
            if (message.attestationRootFingerprint != null && message.hasOwnProperty("attestationRootFingerprint"))
                object.attestationRootFingerprint = message.attestationRootFingerprint;
            if (message.heartbeatSlacDer != null && message.hasOwnProperty("heartbeatSlacDer"))
                object.heartbeatSlacDer = options.bytes === String ? $util.base64.encode(message.heartbeatSlacDer, 0, message.heartbeatSlacDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.heartbeatSlacDer) : message.heartbeatSlacDer;
            if (message.heartbeatDer != null && message.hasOwnProperty("heartbeatDer"))
                object.heartbeatDer = options.bytes === String ? $util.base64.encode(message.heartbeatDer, 0, message.heartbeatDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.heartbeatDer) : message.heartbeatDer;
            if (message.heartbeatIntermediateDer != null && message.hasOwnProperty("heartbeatIntermediateDer"))
                object.heartbeatIntermediateDer = options.bytes === String ? $util.base64.encode(message.heartbeatIntermediateDer, 0, message.heartbeatIntermediateDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.heartbeatIntermediateDer) : message.heartbeatIntermediateDer;
            if (message.heartbeatRootFingerprint != null && message.hasOwnProperty("heartbeatRootFingerprint"))
                object.heartbeatRootFingerprint = message.heartbeatRootFingerprint;
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            if (message.key != null && message.hasOwnProperty("key"))
                object.key = options.bytes === String ? $util.base64.encode(message.key, 0, message.key.length) : options.bytes === Array ? Array.prototype.slice.call(message.key) : message.key;
            return object;
        };

        /**
         * Converts this DeviceInfoResponse to JSON.
         * @function toJSON
         * @memberof lukuid.DeviceInfoResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        DeviceInfoResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for DeviceInfoResponse
         * @function getTypeUrl
         * @memberof lukuid.DeviceInfoResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        DeviceInfoResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.DeviceInfoResponse";
        };

        return DeviceInfoResponse;
    })();

    lukuid.StatusResponse = (function() {

        /**
         * Properties of a StatusResponse.
         * @memberof lukuid
         * @interface IStatusResponse
         * @property {string|null} [id] StatusResponse id
         * @property {string|null} [name] StatusResponse name
         * @property {Uint8Array|null} [publicKey] StatusResponse publicKey
         * @property {number|null} [batteryHealth] StatusResponse batteryHealth
         * @property {number|Long|null} [timestamp] StatusResponse timestamp
         * @property {boolean|null} [hasAttestation] StatusResponse hasAttestation
         * @property {boolean|null} [hasHeartbeat] StatusResponse hasHeartbeat
         * @property {boolean|null} [needsSync] StatusResponse needsSync
         * @property {string|null} [product] StatusResponse product
         * @property {string|null} [model] StatusResponse model
         */

        /**
         * Constructs a new StatusResponse.
         * @memberof lukuid
         * @classdesc Represents a StatusResponse.
         * @implements IStatusResponse
         * @constructor
         * @param {lukuid.IStatusResponse=} [properties] Properties to set
         */
        function StatusResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * StatusResponse id.
         * @member {string} id
         * @memberof lukuid.StatusResponse
         * @instance
         */
        StatusResponse.prototype.id = "";

        /**
         * StatusResponse name.
         * @member {string} name
         * @memberof lukuid.StatusResponse
         * @instance
         */
        StatusResponse.prototype.name = "";

        /**
         * StatusResponse publicKey.
         * @member {Uint8Array} publicKey
         * @memberof lukuid.StatusResponse
         * @instance
         */
        StatusResponse.prototype.publicKey = $util.newBuffer([]);

        /**
         * StatusResponse batteryHealth.
         * @member {number} batteryHealth
         * @memberof lukuid.StatusResponse
         * @instance
         */
        StatusResponse.prototype.batteryHealth = 0;

        /**
         * StatusResponse timestamp.
         * @member {number|Long} timestamp
         * @memberof lukuid.StatusResponse
         * @instance
         */
        StatusResponse.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * StatusResponse hasAttestation.
         * @member {boolean} hasAttestation
         * @memberof lukuid.StatusResponse
         * @instance
         */
        StatusResponse.prototype.hasAttestation = false;

        /**
         * StatusResponse hasHeartbeat.
         * @member {boolean} hasHeartbeat
         * @memberof lukuid.StatusResponse
         * @instance
         */
        StatusResponse.prototype.hasHeartbeat = false;

        /**
         * StatusResponse needsSync.
         * @member {boolean} needsSync
         * @memberof lukuid.StatusResponse
         * @instance
         */
        StatusResponse.prototype.needsSync = false;

        /**
         * StatusResponse product.
         * @member {string} product
         * @memberof lukuid.StatusResponse
         * @instance
         */
        StatusResponse.prototype.product = "";

        /**
         * StatusResponse model.
         * @member {string} model
         * @memberof lukuid.StatusResponse
         * @instance
         */
        StatusResponse.prototype.model = "";

        /**
         * Creates a new StatusResponse instance using the specified properties.
         * @function create
         * @memberof lukuid.StatusResponse
         * @static
         * @param {lukuid.IStatusResponse=} [properties] Properties to set
         * @returns {lukuid.StatusResponse} StatusResponse instance
         */
        StatusResponse.create = function create(properties) {
            return new StatusResponse(properties);
        };

        /**
         * Encodes the specified StatusResponse message. Does not implicitly {@link lukuid.StatusResponse.verify|verify} messages.
         * @function encode
         * @memberof lukuid.StatusResponse
         * @static
         * @param {lukuid.IStatusResponse} message StatusResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StatusResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
            if (message.publicKey != null && Object.hasOwnProperty.call(message, "publicKey"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.publicKey);
            if (message.batteryHealth != null && Object.hasOwnProperty.call(message, "batteryHealth"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.batteryHealth);
            if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
                writer.uint32(/* id 5, wireType 0 =*/40).int64(message.timestamp);
            if (message.hasAttestation != null && Object.hasOwnProperty.call(message, "hasAttestation"))
                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.hasAttestation);
            if (message.hasHeartbeat != null && Object.hasOwnProperty.call(message, "hasHeartbeat"))
                writer.uint32(/* id 7, wireType 0 =*/56).bool(message.hasHeartbeat);
            if (message.needsSync != null && Object.hasOwnProperty.call(message, "needsSync"))
                writer.uint32(/* id 8, wireType 0 =*/64).bool(message.needsSync);
            if (message.product != null && Object.hasOwnProperty.call(message, "product"))
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.product);
            if (message.model != null && Object.hasOwnProperty.call(message, "model"))
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.model);
            return writer;
        };

        /**
         * Encodes the specified StatusResponse message, length delimited. Does not implicitly {@link lukuid.StatusResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.StatusResponse
         * @static
         * @param {lukuid.IStatusResponse} message StatusResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StatusResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a StatusResponse message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.StatusResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.StatusResponse} StatusResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StatusResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.StatusResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.id = reader.string();
                        break;
                    }
                case 2: {
                        message.name = reader.string();
                        break;
                    }
                case 3: {
                        message.publicKey = reader.bytes();
                        break;
                    }
                case 4: {
                        message.batteryHealth = reader.float();
                        break;
                    }
                case 5: {
                        message.timestamp = reader.int64();
                        break;
                    }
                case 6: {
                        message.hasAttestation = reader.bool();
                        break;
                    }
                case 7: {
                        message.hasHeartbeat = reader.bool();
                        break;
                    }
                case 8: {
                        message.needsSync = reader.bool();
                        break;
                    }
                case 9: {
                        message.product = reader.string();
                        break;
                    }
                case 10: {
                        message.model = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a StatusResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.StatusResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.StatusResponse} StatusResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StatusResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StatusResponse message.
         * @function verify
         * @memberof lukuid.StatusResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StatusResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.publicKey != null && message.hasOwnProperty("publicKey"))
                if (!(message.publicKey && typeof message.publicKey.length === "number" || $util.isString(message.publicKey)))
                    return "publicKey: buffer expected";
            if (message.batteryHealth != null && message.hasOwnProperty("batteryHealth"))
                if (typeof message.batteryHealth !== "number")
                    return "batteryHealth: number expected";
            if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                    return "timestamp: integer|Long expected";
            if (message.hasAttestation != null && message.hasOwnProperty("hasAttestation"))
                if (typeof message.hasAttestation !== "boolean")
                    return "hasAttestation: boolean expected";
            if (message.hasHeartbeat != null && message.hasOwnProperty("hasHeartbeat"))
                if (typeof message.hasHeartbeat !== "boolean")
                    return "hasHeartbeat: boolean expected";
            if (message.needsSync != null && message.hasOwnProperty("needsSync"))
                if (typeof message.needsSync !== "boolean")
                    return "needsSync: boolean expected";
            if (message.product != null && message.hasOwnProperty("product"))
                if (!$util.isString(message.product))
                    return "product: string expected";
            if (message.model != null && message.hasOwnProperty("model"))
                if (!$util.isString(message.model))
                    return "model: string expected";
            return null;
        };

        /**
         * Creates a StatusResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.StatusResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.StatusResponse} StatusResponse
         */
        StatusResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.StatusResponse)
                return object;
            let message = new $root.lukuid.StatusResponse();
            if (object.id != null)
                message.id = String(object.id);
            if (object.name != null)
                message.name = String(object.name);
            if (object.publicKey != null)
                if (typeof object.publicKey === "string")
                    $util.base64.decode(object.publicKey, message.publicKey = $util.newBuffer($util.base64.length(object.publicKey)), 0);
                else if (object.publicKey.length >= 0)
                    message.publicKey = object.publicKey;
            if (object.batteryHealth != null)
                message.batteryHealth = Number(object.batteryHealth);
            if (object.timestamp != null)
                if ($util.Long)
                    (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = false;
                else if (typeof object.timestamp === "string")
                    message.timestamp = parseInt(object.timestamp, 10);
                else if (typeof object.timestamp === "number")
                    message.timestamp = object.timestamp;
                else if (typeof object.timestamp === "object")
                    message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
            if (object.hasAttestation != null)
                message.hasAttestation = Boolean(object.hasAttestation);
            if (object.hasHeartbeat != null)
                message.hasHeartbeat = Boolean(object.hasHeartbeat);
            if (object.needsSync != null)
                message.needsSync = Boolean(object.needsSync);
            if (object.product != null)
                message.product = String(object.product);
            if (object.model != null)
                message.model = String(object.model);
            return message;
        };

        /**
         * Creates a plain object from a StatusResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.StatusResponse
         * @static
         * @param {lukuid.StatusResponse} message StatusResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StatusResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.id = "";
                object.name = "";
                if (options.bytes === String)
                    object.publicKey = "";
                else {
                    object.publicKey = [];
                    if (options.bytes !== Array)
                        object.publicKey = $util.newBuffer(object.publicKey);
                }
                object.batteryHealth = 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.timestamp = options.longs === String ? "0" : 0;
                object.hasAttestation = false;
                object.hasHeartbeat = false;
                object.needsSync = false;
                object.product = "";
                object.model = "";
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.publicKey != null && message.hasOwnProperty("publicKey"))
                object.publicKey = options.bytes === String ? $util.base64.encode(message.publicKey, 0, message.publicKey.length) : options.bytes === Array ? Array.prototype.slice.call(message.publicKey) : message.publicKey;
            if (message.batteryHealth != null && message.hasOwnProperty("batteryHealth"))
                object.batteryHealth = options.json && !isFinite(message.batteryHealth) ? String(message.batteryHealth) : message.batteryHealth;
            if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                if (typeof message.timestamp === "number")
                    object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                else
                    object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber() : message.timestamp;
            if (message.hasAttestation != null && message.hasOwnProperty("hasAttestation"))
                object.hasAttestation = message.hasAttestation;
            if (message.hasHeartbeat != null && message.hasOwnProperty("hasHeartbeat"))
                object.hasHeartbeat = message.hasHeartbeat;
            if (message.needsSync != null && message.hasOwnProperty("needsSync"))
                object.needsSync = message.needsSync;
            if (message.product != null && message.hasOwnProperty("product"))
                object.product = message.product;
            if (message.model != null && message.hasOwnProperty("model"))
                object.model = message.model;
            return object;
        };

        /**
         * Converts this StatusResponse to JSON.
         * @function toJSON
         * @memberof lukuid.StatusResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StatusResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for StatusResponse
         * @function getTypeUrl
         * @memberof lukuid.StatusResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        StatusResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.StatusResponse";
        };

        return StatusResponse;
    })();

    lukuid.NetworkConfigResponse = (function() {

        /**
         * Properties of a NetworkConfigResponse.
         * @memberof lukuid
         * @interface INetworkConfigResponse
         * @property {string|null} [wifiSsid] NetworkConfigResponse wifiSsid
         * @property {boolean|null} [wifiPasswordSet] NetworkConfigResponse wifiPasswordSet
         * @property {string|null} [mqttBrokerUrl] NetworkConfigResponse mqttBrokerUrl
         * @property {number|null} [mqttPort] NetworkConfigResponse mqttPort
         * @property {string|null} [mqttTopic] NetworkConfigResponse mqttTopic
         * @property {number|null} [mqttBroadcastFrequencySeconds] NetworkConfigResponse mqttBroadcastFrequencySeconds
         * @property {string|null} [mqttUsername] NetworkConfigResponse mqttUsername
         * @property {boolean|null} [mqttPasswordSet] NetworkConfigResponse mqttPasswordSet
         * @property {boolean|null} [mqttBroadcastEnabled] NetworkConfigResponse mqttBroadcastEnabled
         * @property {Uint8Array|null} [csr] NetworkConfigResponse csr
         * @property {Uint8Array|null} [mqttCertificateDer] NetworkConfigResponse mqttCertificateDer
         * @property {Uint8Array|null} [mqttCaDer] NetworkConfigResponse mqttCaDer
         */

        /**
         * Constructs a new NetworkConfigResponse.
         * @memberof lukuid
         * @classdesc Represents a NetworkConfigResponse.
         * @implements INetworkConfigResponse
         * @constructor
         * @param {lukuid.INetworkConfigResponse=} [properties] Properties to set
         */
        function NetworkConfigResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * NetworkConfigResponse wifiSsid.
         * @member {string} wifiSsid
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.wifiSsid = "";

        /**
         * NetworkConfigResponse wifiPasswordSet.
         * @member {boolean} wifiPasswordSet
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.wifiPasswordSet = false;

        /**
         * NetworkConfigResponse mqttBrokerUrl.
         * @member {string} mqttBrokerUrl
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.mqttBrokerUrl = "";

        /**
         * NetworkConfigResponse mqttPort.
         * @member {number} mqttPort
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.mqttPort = 0;

        /**
         * NetworkConfigResponse mqttTopic.
         * @member {string} mqttTopic
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.mqttTopic = "";

        /**
         * NetworkConfigResponse mqttBroadcastFrequencySeconds.
         * @member {number} mqttBroadcastFrequencySeconds
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.mqttBroadcastFrequencySeconds = 0;

        /**
         * NetworkConfigResponse mqttUsername.
         * @member {string} mqttUsername
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.mqttUsername = "";

        /**
         * NetworkConfigResponse mqttPasswordSet.
         * @member {boolean} mqttPasswordSet
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.mqttPasswordSet = false;

        /**
         * NetworkConfigResponse mqttBroadcastEnabled.
         * @member {boolean} mqttBroadcastEnabled
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.mqttBroadcastEnabled = false;

        /**
         * NetworkConfigResponse csr.
         * @member {Uint8Array} csr
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.csr = $util.newBuffer([]);

        /**
         * NetworkConfigResponse mqttCertificateDer.
         * @member {Uint8Array} mqttCertificateDer
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.mqttCertificateDer = $util.newBuffer([]);

        /**
         * NetworkConfigResponse mqttCaDer.
         * @member {Uint8Array} mqttCaDer
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         */
        NetworkConfigResponse.prototype.mqttCaDer = $util.newBuffer([]);

        /**
         * Creates a new NetworkConfigResponse instance using the specified properties.
         * @function create
         * @memberof lukuid.NetworkConfigResponse
         * @static
         * @param {lukuid.INetworkConfigResponse=} [properties] Properties to set
         * @returns {lukuid.NetworkConfigResponse} NetworkConfigResponse instance
         */
        NetworkConfigResponse.create = function create(properties) {
            return new NetworkConfigResponse(properties);
        };

        /**
         * Encodes the specified NetworkConfigResponse message. Does not implicitly {@link lukuid.NetworkConfigResponse.verify|verify} messages.
         * @function encode
         * @memberof lukuid.NetworkConfigResponse
         * @static
         * @param {lukuid.INetworkConfigResponse} message NetworkConfigResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NetworkConfigResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.wifiSsid != null && Object.hasOwnProperty.call(message, "wifiSsid"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.wifiSsid);
            if (message.wifiPasswordSet != null && Object.hasOwnProperty.call(message, "wifiPasswordSet"))
                writer.uint32(/* id 2, wireType 0 =*/16).bool(message.wifiPasswordSet);
            if (message.mqttBrokerUrl != null && Object.hasOwnProperty.call(message, "mqttBrokerUrl"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.mqttBrokerUrl);
            if (message.mqttPort != null && Object.hasOwnProperty.call(message, "mqttPort"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.mqttPort);
            if (message.mqttTopic != null && Object.hasOwnProperty.call(message, "mqttTopic"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.mqttTopic);
            if (message.mqttBroadcastFrequencySeconds != null && Object.hasOwnProperty.call(message, "mqttBroadcastFrequencySeconds"))
                writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.mqttBroadcastFrequencySeconds);
            if (message.mqttUsername != null && Object.hasOwnProperty.call(message, "mqttUsername"))
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.mqttUsername);
            if (message.mqttPasswordSet != null && Object.hasOwnProperty.call(message, "mqttPasswordSet"))
                writer.uint32(/* id 8, wireType 0 =*/64).bool(message.mqttPasswordSet);
            if (message.mqttBroadcastEnabled != null && Object.hasOwnProperty.call(message, "mqttBroadcastEnabled"))
                writer.uint32(/* id 9, wireType 0 =*/72).bool(message.mqttBroadcastEnabled);
            if (message.csr != null && Object.hasOwnProperty.call(message, "csr"))
                writer.uint32(/* id 10, wireType 2 =*/82).bytes(message.csr);
            if (message.mqttCertificateDer != null && Object.hasOwnProperty.call(message, "mqttCertificateDer"))
                writer.uint32(/* id 11, wireType 2 =*/90).bytes(message.mqttCertificateDer);
            if (message.mqttCaDer != null && Object.hasOwnProperty.call(message, "mqttCaDer"))
                writer.uint32(/* id 12, wireType 2 =*/98).bytes(message.mqttCaDer);
            return writer;
        };

        /**
         * Encodes the specified NetworkConfigResponse message, length delimited. Does not implicitly {@link lukuid.NetworkConfigResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.NetworkConfigResponse
         * @static
         * @param {lukuid.INetworkConfigResponse} message NetworkConfigResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NetworkConfigResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a NetworkConfigResponse message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.NetworkConfigResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.NetworkConfigResponse} NetworkConfigResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NetworkConfigResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.NetworkConfigResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.wifiSsid = reader.string();
                        break;
                    }
                case 2: {
                        message.wifiPasswordSet = reader.bool();
                        break;
                    }
                case 3: {
                        message.mqttBrokerUrl = reader.string();
                        break;
                    }
                case 4: {
                        message.mqttPort = reader.uint32();
                        break;
                    }
                case 5: {
                        message.mqttTopic = reader.string();
                        break;
                    }
                case 6: {
                        message.mqttBroadcastFrequencySeconds = reader.uint32();
                        break;
                    }
                case 7: {
                        message.mqttUsername = reader.string();
                        break;
                    }
                case 8: {
                        message.mqttPasswordSet = reader.bool();
                        break;
                    }
                case 9: {
                        message.mqttBroadcastEnabled = reader.bool();
                        break;
                    }
                case 10: {
                        message.csr = reader.bytes();
                        break;
                    }
                case 11: {
                        message.mqttCertificateDer = reader.bytes();
                        break;
                    }
                case 12: {
                        message.mqttCaDer = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a NetworkConfigResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.NetworkConfigResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.NetworkConfigResponse} NetworkConfigResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NetworkConfigResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a NetworkConfigResponse message.
         * @function verify
         * @memberof lukuid.NetworkConfigResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        NetworkConfigResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.wifiSsid != null && message.hasOwnProperty("wifiSsid"))
                if (!$util.isString(message.wifiSsid))
                    return "wifiSsid: string expected";
            if (message.wifiPasswordSet != null && message.hasOwnProperty("wifiPasswordSet"))
                if (typeof message.wifiPasswordSet !== "boolean")
                    return "wifiPasswordSet: boolean expected";
            if (message.mqttBrokerUrl != null && message.hasOwnProperty("mqttBrokerUrl"))
                if (!$util.isString(message.mqttBrokerUrl))
                    return "mqttBrokerUrl: string expected";
            if (message.mqttPort != null && message.hasOwnProperty("mqttPort"))
                if (!$util.isInteger(message.mqttPort))
                    return "mqttPort: integer expected";
            if (message.mqttTopic != null && message.hasOwnProperty("mqttTopic"))
                if (!$util.isString(message.mqttTopic))
                    return "mqttTopic: string expected";
            if (message.mqttBroadcastFrequencySeconds != null && message.hasOwnProperty("mqttBroadcastFrequencySeconds"))
                if (!$util.isInteger(message.mqttBroadcastFrequencySeconds))
                    return "mqttBroadcastFrequencySeconds: integer expected";
            if (message.mqttUsername != null && message.hasOwnProperty("mqttUsername"))
                if (!$util.isString(message.mqttUsername))
                    return "mqttUsername: string expected";
            if (message.mqttPasswordSet != null && message.hasOwnProperty("mqttPasswordSet"))
                if (typeof message.mqttPasswordSet !== "boolean")
                    return "mqttPasswordSet: boolean expected";
            if (message.mqttBroadcastEnabled != null && message.hasOwnProperty("mqttBroadcastEnabled"))
                if (typeof message.mqttBroadcastEnabled !== "boolean")
                    return "mqttBroadcastEnabled: boolean expected";
            if (message.csr != null && message.hasOwnProperty("csr"))
                if (!(message.csr && typeof message.csr.length === "number" || $util.isString(message.csr)))
                    return "csr: buffer expected";
            if (message.mqttCertificateDer != null && message.hasOwnProperty("mqttCertificateDer"))
                if (!(message.mqttCertificateDer && typeof message.mqttCertificateDer.length === "number" || $util.isString(message.mqttCertificateDer)))
                    return "mqttCertificateDer: buffer expected";
            if (message.mqttCaDer != null && message.hasOwnProperty("mqttCaDer"))
                if (!(message.mqttCaDer && typeof message.mqttCaDer.length === "number" || $util.isString(message.mqttCaDer)))
                    return "mqttCaDer: buffer expected";
            return null;
        };

        /**
         * Creates a NetworkConfigResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.NetworkConfigResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.NetworkConfigResponse} NetworkConfigResponse
         */
        NetworkConfigResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.NetworkConfigResponse)
                return object;
            let message = new $root.lukuid.NetworkConfigResponse();
            if (object.wifiSsid != null)
                message.wifiSsid = String(object.wifiSsid);
            if (object.wifiPasswordSet != null)
                message.wifiPasswordSet = Boolean(object.wifiPasswordSet);
            if (object.mqttBrokerUrl != null)
                message.mqttBrokerUrl = String(object.mqttBrokerUrl);
            if (object.mqttPort != null)
                message.mqttPort = object.mqttPort >>> 0;
            if (object.mqttTopic != null)
                message.mqttTopic = String(object.mqttTopic);
            if (object.mqttBroadcastFrequencySeconds != null)
                message.mqttBroadcastFrequencySeconds = object.mqttBroadcastFrequencySeconds >>> 0;
            if (object.mqttUsername != null)
                message.mqttUsername = String(object.mqttUsername);
            if (object.mqttPasswordSet != null)
                message.mqttPasswordSet = Boolean(object.mqttPasswordSet);
            if (object.mqttBroadcastEnabled != null)
                message.mqttBroadcastEnabled = Boolean(object.mqttBroadcastEnabled);
            if (object.csr != null)
                if (typeof object.csr === "string")
                    $util.base64.decode(object.csr, message.csr = $util.newBuffer($util.base64.length(object.csr)), 0);
                else if (object.csr.length >= 0)
                    message.csr = object.csr;
            if (object.mqttCertificateDer != null)
                if (typeof object.mqttCertificateDer === "string")
                    $util.base64.decode(object.mqttCertificateDer, message.mqttCertificateDer = $util.newBuffer($util.base64.length(object.mqttCertificateDer)), 0);
                else if (object.mqttCertificateDer.length >= 0)
                    message.mqttCertificateDer = object.mqttCertificateDer;
            if (object.mqttCaDer != null)
                if (typeof object.mqttCaDer === "string")
                    $util.base64.decode(object.mqttCaDer, message.mqttCaDer = $util.newBuffer($util.base64.length(object.mqttCaDer)), 0);
                else if (object.mqttCaDer.length >= 0)
                    message.mqttCaDer = object.mqttCaDer;
            return message;
        };

        /**
         * Creates a plain object from a NetworkConfigResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.NetworkConfigResponse
         * @static
         * @param {lukuid.NetworkConfigResponse} message NetworkConfigResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        NetworkConfigResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.wifiSsid = "";
                object.wifiPasswordSet = false;
                object.mqttBrokerUrl = "";
                object.mqttPort = 0;
                object.mqttTopic = "";
                object.mqttBroadcastFrequencySeconds = 0;
                object.mqttUsername = "";
                object.mqttPasswordSet = false;
                object.mqttBroadcastEnabled = false;
                if (options.bytes === String)
                    object.csr = "";
                else {
                    object.csr = [];
                    if (options.bytes !== Array)
                        object.csr = $util.newBuffer(object.csr);
                }
                if (options.bytes === String)
                    object.mqttCertificateDer = "";
                else {
                    object.mqttCertificateDer = [];
                    if (options.bytes !== Array)
                        object.mqttCertificateDer = $util.newBuffer(object.mqttCertificateDer);
                }
                if (options.bytes === String)
                    object.mqttCaDer = "";
                else {
                    object.mqttCaDer = [];
                    if (options.bytes !== Array)
                        object.mqttCaDer = $util.newBuffer(object.mqttCaDer);
                }
            }
            if (message.wifiSsid != null && message.hasOwnProperty("wifiSsid"))
                object.wifiSsid = message.wifiSsid;
            if (message.wifiPasswordSet != null && message.hasOwnProperty("wifiPasswordSet"))
                object.wifiPasswordSet = message.wifiPasswordSet;
            if (message.mqttBrokerUrl != null && message.hasOwnProperty("mqttBrokerUrl"))
                object.mqttBrokerUrl = message.mqttBrokerUrl;
            if (message.mqttPort != null && message.hasOwnProperty("mqttPort"))
                object.mqttPort = message.mqttPort;
            if (message.mqttTopic != null && message.hasOwnProperty("mqttTopic"))
                object.mqttTopic = message.mqttTopic;
            if (message.mqttBroadcastFrequencySeconds != null && message.hasOwnProperty("mqttBroadcastFrequencySeconds"))
                object.mqttBroadcastFrequencySeconds = message.mqttBroadcastFrequencySeconds;
            if (message.mqttUsername != null && message.hasOwnProperty("mqttUsername"))
                object.mqttUsername = message.mqttUsername;
            if (message.mqttPasswordSet != null && message.hasOwnProperty("mqttPasswordSet"))
                object.mqttPasswordSet = message.mqttPasswordSet;
            if (message.mqttBroadcastEnabled != null && message.hasOwnProperty("mqttBroadcastEnabled"))
                object.mqttBroadcastEnabled = message.mqttBroadcastEnabled;
            if (message.csr != null && message.hasOwnProperty("csr"))
                object.csr = options.bytes === String ? $util.base64.encode(message.csr, 0, message.csr.length) : options.bytes === Array ? Array.prototype.slice.call(message.csr) : message.csr;
            if (message.mqttCertificateDer != null && message.hasOwnProperty("mqttCertificateDer"))
                object.mqttCertificateDer = options.bytes === String ? $util.base64.encode(message.mqttCertificateDer, 0, message.mqttCertificateDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.mqttCertificateDer) : message.mqttCertificateDer;
            if (message.mqttCaDer != null && message.hasOwnProperty("mqttCaDer"))
                object.mqttCaDer = options.bytes === String ? $util.base64.encode(message.mqttCaDer, 0, message.mqttCaDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.mqttCaDer) : message.mqttCaDer;
            return object;
        };

        /**
         * Converts this NetworkConfigResponse to JSON.
         * @function toJSON
         * @memberof lukuid.NetworkConfigResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        NetworkConfigResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for NetworkConfigResponse
         * @function getTypeUrl
         * @memberof lukuid.NetworkConfigResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        NetworkConfigResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.NetworkConfigResponse";
        };

        return NetworkConfigResponse;
    })();

    lukuid.RecordMeta = (function() {

        /**
         * Properties of a RecordMeta.
         * @memberof lukuid
         * @interface IRecordMeta
         * @property {number|Long|null} [timestampUtc] RecordMeta timestampUtc
         * @property {number|null} [deviceId] RecordMeta deviceId
         * @property {string|null} [recordId] RecordMeta recordId
         */

        /**
         * Constructs a new RecordMeta.
         * @memberof lukuid
         * @classdesc Represents a RecordMeta.
         * @implements IRecordMeta
         * @constructor
         * @param {lukuid.IRecordMeta=} [properties] Properties to set
         */
        function RecordMeta(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RecordMeta timestampUtc.
         * @member {number|Long} timestampUtc
         * @memberof lukuid.RecordMeta
         * @instance
         */
        RecordMeta.prototype.timestampUtc = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * RecordMeta deviceId.
         * @member {number} deviceId
         * @memberof lukuid.RecordMeta
         * @instance
         */
        RecordMeta.prototype.deviceId = 0;

        /**
         * RecordMeta recordId.
         * @member {string} recordId
         * @memberof lukuid.RecordMeta
         * @instance
         */
        RecordMeta.prototype.recordId = "";

        /**
         * Creates a new RecordMeta instance using the specified properties.
         * @function create
         * @memberof lukuid.RecordMeta
         * @static
         * @param {lukuid.IRecordMeta=} [properties] Properties to set
         * @returns {lukuid.RecordMeta} RecordMeta instance
         */
        RecordMeta.create = function create(properties) {
            return new RecordMeta(properties);
        };

        /**
         * Encodes the specified RecordMeta message. Does not implicitly {@link lukuid.RecordMeta.verify|verify} messages.
         * @function encode
         * @memberof lukuid.RecordMeta
         * @static
         * @param {lukuid.IRecordMeta} message RecordMeta message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecordMeta.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.timestampUtc != null && Object.hasOwnProperty.call(message, "timestampUtc"))
                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.timestampUtc);
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.deviceId);
            if (message.recordId != null && Object.hasOwnProperty.call(message, "recordId"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.recordId);
            return writer;
        };

        /**
         * Encodes the specified RecordMeta message, length delimited. Does not implicitly {@link lukuid.RecordMeta.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.RecordMeta
         * @static
         * @param {lukuid.IRecordMeta} message RecordMeta message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecordMeta.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RecordMeta message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.RecordMeta
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.RecordMeta} RecordMeta
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecordMeta.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.RecordMeta();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.timestampUtc = reader.int64();
                        break;
                    }
                case 2: {
                        message.deviceId = reader.uint32();
                        break;
                    }
                case 3: {
                        message.recordId = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RecordMeta message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.RecordMeta
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.RecordMeta} RecordMeta
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecordMeta.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RecordMeta message.
         * @function verify
         * @memberof lukuid.RecordMeta
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RecordMeta.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (!$util.isInteger(message.timestampUtc) && !(message.timestampUtc && $util.isInteger(message.timestampUtc.low) && $util.isInteger(message.timestampUtc.high)))
                    return "timestampUtc: integer|Long expected";
            if (message.deviceId != null && message.hasOwnProperty("deviceId"))
                if (!$util.isInteger(message.deviceId))
                    return "deviceId: integer expected";
            if (message.recordId != null && message.hasOwnProperty("recordId"))
                if (!$util.isString(message.recordId))
                    return "recordId: string expected";
            return null;
        };

        /**
         * Creates a RecordMeta message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.RecordMeta
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.RecordMeta} RecordMeta
         */
        RecordMeta.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.RecordMeta)
                return object;
            let message = new $root.lukuid.RecordMeta();
            if (object.timestampUtc != null)
                if ($util.Long)
                    (message.timestampUtc = $util.Long.fromValue(object.timestampUtc)).unsigned = false;
                else if (typeof object.timestampUtc === "string")
                    message.timestampUtc = parseInt(object.timestampUtc, 10);
                else if (typeof object.timestampUtc === "number")
                    message.timestampUtc = object.timestampUtc;
                else if (typeof object.timestampUtc === "object")
                    message.timestampUtc = new $util.LongBits(object.timestampUtc.low >>> 0, object.timestampUtc.high >>> 0).toNumber();
            if (object.deviceId != null)
                message.deviceId = object.deviceId >>> 0;
            if (object.recordId != null)
                message.recordId = String(object.recordId);
            return message;
        };

        /**
         * Creates a plain object from a RecordMeta message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.RecordMeta
         * @static
         * @param {lukuid.RecordMeta} message RecordMeta
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RecordMeta.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.timestampUtc = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.timestampUtc = options.longs === String ? "0" : 0;
                object.deviceId = 0;
                object.recordId = "";
            }
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (typeof message.timestampUtc === "number")
                    object.timestampUtc = options.longs === String ? String(message.timestampUtc) : message.timestampUtc;
                else
                    object.timestampUtc = options.longs === String ? $util.Long.prototype.toString.call(message.timestampUtc) : options.longs === Number ? new $util.LongBits(message.timestampUtc.low >>> 0, message.timestampUtc.high >>> 0).toNumber() : message.timestampUtc;
            if (message.deviceId != null && message.hasOwnProperty("deviceId"))
                object.deviceId = message.deviceId;
            if (message.recordId != null && message.hasOwnProperty("recordId"))
                object.recordId = message.recordId;
            return object;
        };

        /**
         * Converts this RecordMeta to JSON.
         * @function toJSON
         * @memberof lukuid.RecordMeta
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RecordMeta.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for RecordMeta
         * @function getTypeUrl
         * @memberof lukuid.RecordMeta
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        RecordMeta.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.RecordMeta";
        };

        return RecordMeta;
    })();

    lukuid.ScanRecordMin = (function() {

        /**
         * Properties of a ScanRecordMin.
         * @memberof lukuid
         * @interface IScanRecordMin
         * @property {string|null} [version] ScanRecordMin version
         * @property {string|null} [recordId] ScanRecordMin recordId
         * @property {number|Long|null} [timestampUtc] ScanRecordMin timestampUtc
         * @property {string|null} [tagId] ScanRecordMin tagId
         * @property {number|null} [scoreBio] ScanRecordMin scoreBio
         * @property {number|null} [scoreAuth] ScanRecordMin scoreAuth
         * @property {number|null} [scoreEnv] ScanRecordMin scoreEnv
         */

        /**
         * Constructs a new ScanRecordMin.
         * @memberof lukuid
         * @classdesc Represents a ScanRecordMin.
         * @implements IScanRecordMin
         * @constructor
         * @param {lukuid.IScanRecordMin=} [properties] Properties to set
         */
        function ScanRecordMin(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ScanRecordMin version.
         * @member {string} version
         * @memberof lukuid.ScanRecordMin
         * @instance
         */
        ScanRecordMin.prototype.version = "";

        /**
         * ScanRecordMin recordId.
         * @member {string} recordId
         * @memberof lukuid.ScanRecordMin
         * @instance
         */
        ScanRecordMin.prototype.recordId = "";

        /**
         * ScanRecordMin timestampUtc.
         * @member {number|Long} timestampUtc
         * @memberof lukuid.ScanRecordMin
         * @instance
         */
        ScanRecordMin.prototype.timestampUtc = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * ScanRecordMin tagId.
         * @member {string} tagId
         * @memberof lukuid.ScanRecordMin
         * @instance
         */
        ScanRecordMin.prototype.tagId = "";

        /**
         * ScanRecordMin scoreBio.
         * @member {number} scoreBio
         * @memberof lukuid.ScanRecordMin
         * @instance
         */
        ScanRecordMin.prototype.scoreBio = 0;

        /**
         * ScanRecordMin scoreAuth.
         * @member {number} scoreAuth
         * @memberof lukuid.ScanRecordMin
         * @instance
         */
        ScanRecordMin.prototype.scoreAuth = 0;

        /**
         * ScanRecordMin scoreEnv.
         * @member {number} scoreEnv
         * @memberof lukuid.ScanRecordMin
         * @instance
         */
        ScanRecordMin.prototype.scoreEnv = 0;

        /**
         * Creates a new ScanRecordMin instance using the specified properties.
         * @function create
         * @memberof lukuid.ScanRecordMin
         * @static
         * @param {lukuid.IScanRecordMin=} [properties] Properties to set
         * @returns {lukuid.ScanRecordMin} ScanRecordMin instance
         */
        ScanRecordMin.create = function create(properties) {
            return new ScanRecordMin(properties);
        };

        /**
         * Encodes the specified ScanRecordMin message. Does not implicitly {@link lukuid.ScanRecordMin.verify|verify} messages.
         * @function encode
         * @memberof lukuid.ScanRecordMin
         * @static
         * @param {lukuid.IScanRecordMin} message ScanRecordMin message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ScanRecordMin.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.version != null && Object.hasOwnProperty.call(message, "version"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.version);
            if (message.recordId != null && Object.hasOwnProperty.call(message, "recordId"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.recordId);
            if (message.timestampUtc != null && Object.hasOwnProperty.call(message, "timestampUtc"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.timestampUtc);
            if (message.tagId != null && Object.hasOwnProperty.call(message, "tagId"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.tagId);
            if (message.scoreBio != null && Object.hasOwnProperty.call(message, "scoreBio"))
                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.scoreBio);
            if (message.scoreAuth != null && Object.hasOwnProperty.call(message, "scoreAuth"))
                writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.scoreAuth);
            if (message.scoreEnv != null && Object.hasOwnProperty.call(message, "scoreEnv"))
                writer.uint32(/* id 7, wireType 0 =*/56).uint32(message.scoreEnv);
            return writer;
        };

        /**
         * Encodes the specified ScanRecordMin message, length delimited. Does not implicitly {@link lukuid.ScanRecordMin.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.ScanRecordMin
         * @static
         * @param {lukuid.IScanRecordMin} message ScanRecordMin message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ScanRecordMin.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ScanRecordMin message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.ScanRecordMin
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.ScanRecordMin} ScanRecordMin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ScanRecordMin.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.ScanRecordMin();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.version = reader.string();
                        break;
                    }
                case 2: {
                        message.recordId = reader.string();
                        break;
                    }
                case 3: {
                        message.timestampUtc = reader.int64();
                        break;
                    }
                case 4: {
                        message.tagId = reader.string();
                        break;
                    }
                case 5: {
                        message.scoreBio = reader.uint32();
                        break;
                    }
                case 6: {
                        message.scoreAuth = reader.uint32();
                        break;
                    }
                case 7: {
                        message.scoreEnv = reader.uint32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ScanRecordMin message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.ScanRecordMin
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.ScanRecordMin} ScanRecordMin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ScanRecordMin.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ScanRecordMin message.
         * @function verify
         * @memberof lukuid.ScanRecordMin
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ScanRecordMin.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.version != null && message.hasOwnProperty("version"))
                if (!$util.isString(message.version))
                    return "version: string expected";
            if (message.recordId != null && message.hasOwnProperty("recordId"))
                if (!$util.isString(message.recordId))
                    return "recordId: string expected";
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (!$util.isInteger(message.timestampUtc) && !(message.timestampUtc && $util.isInteger(message.timestampUtc.low) && $util.isInteger(message.timestampUtc.high)))
                    return "timestampUtc: integer|Long expected";
            if (message.tagId != null && message.hasOwnProperty("tagId"))
                if (!$util.isString(message.tagId))
                    return "tagId: string expected";
            if (message.scoreBio != null && message.hasOwnProperty("scoreBio"))
                if (!$util.isInteger(message.scoreBio))
                    return "scoreBio: integer expected";
            if (message.scoreAuth != null && message.hasOwnProperty("scoreAuth"))
                if (!$util.isInteger(message.scoreAuth))
                    return "scoreAuth: integer expected";
            if (message.scoreEnv != null && message.hasOwnProperty("scoreEnv"))
                if (!$util.isInteger(message.scoreEnv))
                    return "scoreEnv: integer expected";
            return null;
        };

        /**
         * Creates a ScanRecordMin message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.ScanRecordMin
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.ScanRecordMin} ScanRecordMin
         */
        ScanRecordMin.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.ScanRecordMin)
                return object;
            let message = new $root.lukuid.ScanRecordMin();
            if (object.version != null)
                message.version = String(object.version);
            if (object.recordId != null)
                message.recordId = String(object.recordId);
            if (object.timestampUtc != null)
                if ($util.Long)
                    (message.timestampUtc = $util.Long.fromValue(object.timestampUtc)).unsigned = false;
                else if (typeof object.timestampUtc === "string")
                    message.timestampUtc = parseInt(object.timestampUtc, 10);
                else if (typeof object.timestampUtc === "number")
                    message.timestampUtc = object.timestampUtc;
                else if (typeof object.timestampUtc === "object")
                    message.timestampUtc = new $util.LongBits(object.timestampUtc.low >>> 0, object.timestampUtc.high >>> 0).toNumber();
            if (object.tagId != null)
                message.tagId = String(object.tagId);
            if (object.scoreBio != null)
                message.scoreBio = object.scoreBio >>> 0;
            if (object.scoreAuth != null)
                message.scoreAuth = object.scoreAuth >>> 0;
            if (object.scoreEnv != null)
                message.scoreEnv = object.scoreEnv >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a ScanRecordMin message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.ScanRecordMin
         * @static
         * @param {lukuid.ScanRecordMin} message ScanRecordMin
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ScanRecordMin.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.version = "";
                object.recordId = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.timestampUtc = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.timestampUtc = options.longs === String ? "0" : 0;
                object.tagId = "";
                object.scoreBio = 0;
                object.scoreAuth = 0;
                object.scoreEnv = 0;
            }
            if (message.version != null && message.hasOwnProperty("version"))
                object.version = message.version;
            if (message.recordId != null && message.hasOwnProperty("recordId"))
                object.recordId = message.recordId;
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (typeof message.timestampUtc === "number")
                    object.timestampUtc = options.longs === String ? String(message.timestampUtc) : message.timestampUtc;
                else
                    object.timestampUtc = options.longs === String ? $util.Long.prototype.toString.call(message.timestampUtc) : options.longs === Number ? new $util.LongBits(message.timestampUtc.low >>> 0, message.timestampUtc.high >>> 0).toNumber() : message.timestampUtc;
            if (message.tagId != null && message.hasOwnProperty("tagId"))
                object.tagId = message.tagId;
            if (message.scoreBio != null && message.hasOwnProperty("scoreBio"))
                object.scoreBio = message.scoreBio;
            if (message.scoreAuth != null && message.hasOwnProperty("scoreAuth"))
                object.scoreAuth = message.scoreAuth;
            if (message.scoreEnv != null && message.hasOwnProperty("scoreEnv"))
                object.scoreEnv = message.scoreEnv;
            return object;
        };

        /**
         * Converts this ScanRecordMin to JSON.
         * @function toJSON
         * @memberof lukuid.ScanRecordMin
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ScanRecordMin.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ScanRecordMin
         * @function getTypeUrl
         * @memberof lukuid.ScanRecordMin
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ScanRecordMin.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.ScanRecordMin";
        };

        return ScanRecordMin;
    })();

    lukuid.EnvironmentRecordMin = (function() {

        /**
         * Properties of an EnvironmentRecordMin.
         * @memberof lukuid
         * @interface IEnvironmentRecordMin
         * @property {string|null} [version] EnvironmentRecordMin version
         * @property {string|null} [recordId] EnvironmentRecordMin recordId
         * @property {number|Long|null} [timestampUtc] EnvironmentRecordMin timestampUtc
         * @property {lukuid.IMetricValue|null} [lux] EnvironmentRecordMin lux
         * @property {lukuid.IMetricValue|null} [tempC] EnvironmentRecordMin tempC
         * @property {lukuid.IMetricValue|null} [humidityPct] EnvironmentRecordMin humidityPct
         * @property {lukuid.IMetricValue|null} [vocIndex] EnvironmentRecordMin vocIndex
         * @property {boolean|null} [tamper] EnvironmentRecordMin tamper
         * @property {boolean|null} [wakeEvent] EnvironmentRecordMin wakeEvent
         * @property {boolean|null} [vbusPresent] EnvironmentRecordMin vbusPresent
         */

        /**
         * Constructs a new EnvironmentRecordMin.
         * @memberof lukuid
         * @classdesc Represents an EnvironmentRecordMin.
         * @implements IEnvironmentRecordMin
         * @constructor
         * @param {lukuid.IEnvironmentRecordMin=} [properties] Properties to set
         */
        function EnvironmentRecordMin(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * EnvironmentRecordMin version.
         * @member {string} version
         * @memberof lukuid.EnvironmentRecordMin
         * @instance
         */
        EnvironmentRecordMin.prototype.version = "";

        /**
         * EnvironmentRecordMin recordId.
         * @member {string} recordId
         * @memberof lukuid.EnvironmentRecordMin
         * @instance
         */
        EnvironmentRecordMin.prototype.recordId = "";

        /**
         * EnvironmentRecordMin timestampUtc.
         * @member {number|Long} timestampUtc
         * @memberof lukuid.EnvironmentRecordMin
         * @instance
         */
        EnvironmentRecordMin.prototype.timestampUtc = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * EnvironmentRecordMin lux.
         * @member {lukuid.IMetricValue|null|undefined} lux
         * @memberof lukuid.EnvironmentRecordMin
         * @instance
         */
        EnvironmentRecordMin.prototype.lux = null;

        /**
         * EnvironmentRecordMin tempC.
         * @member {lukuid.IMetricValue|null|undefined} tempC
         * @memberof lukuid.EnvironmentRecordMin
         * @instance
         */
        EnvironmentRecordMin.prototype.tempC = null;

        /**
         * EnvironmentRecordMin humidityPct.
         * @member {lukuid.IMetricValue|null|undefined} humidityPct
         * @memberof lukuid.EnvironmentRecordMin
         * @instance
         */
        EnvironmentRecordMin.prototype.humidityPct = null;

        /**
         * EnvironmentRecordMin vocIndex.
         * @member {lukuid.IMetricValue|null|undefined} vocIndex
         * @memberof lukuid.EnvironmentRecordMin
         * @instance
         */
        EnvironmentRecordMin.prototype.vocIndex = null;

        /**
         * EnvironmentRecordMin tamper.
         * @member {boolean} tamper
         * @memberof lukuid.EnvironmentRecordMin
         * @instance
         */
        EnvironmentRecordMin.prototype.tamper = false;

        /**
         * EnvironmentRecordMin wakeEvent.
         * @member {boolean} wakeEvent
         * @memberof lukuid.EnvironmentRecordMin
         * @instance
         */
        EnvironmentRecordMin.prototype.wakeEvent = false;

        /**
         * EnvironmentRecordMin vbusPresent.
         * @member {boolean} vbusPresent
         * @memberof lukuid.EnvironmentRecordMin
         * @instance
         */
        EnvironmentRecordMin.prototype.vbusPresent = false;

        /**
         * Creates a new EnvironmentRecordMin instance using the specified properties.
         * @function create
         * @memberof lukuid.EnvironmentRecordMin
         * @static
         * @param {lukuid.IEnvironmentRecordMin=} [properties] Properties to set
         * @returns {lukuid.EnvironmentRecordMin} EnvironmentRecordMin instance
         */
        EnvironmentRecordMin.create = function create(properties) {
            return new EnvironmentRecordMin(properties);
        };

        /**
         * Encodes the specified EnvironmentRecordMin message. Does not implicitly {@link lukuid.EnvironmentRecordMin.verify|verify} messages.
         * @function encode
         * @memberof lukuid.EnvironmentRecordMin
         * @static
         * @param {lukuid.IEnvironmentRecordMin} message EnvironmentRecordMin message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EnvironmentRecordMin.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.version != null && Object.hasOwnProperty.call(message, "version"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.version);
            if (message.recordId != null && Object.hasOwnProperty.call(message, "recordId"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.recordId);
            if (message.timestampUtc != null && Object.hasOwnProperty.call(message, "timestampUtc"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.timestampUtc);
            if (message.lux != null && Object.hasOwnProperty.call(message, "lux"))
                $root.lukuid.MetricValue.encode(message.lux, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            if (message.tempC != null && Object.hasOwnProperty.call(message, "tempC"))
                $root.lukuid.MetricValue.encode(message.tempC, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.humidityPct != null && Object.hasOwnProperty.call(message, "humidityPct"))
                $root.lukuid.MetricValue.encode(message.humidityPct, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.vocIndex != null && Object.hasOwnProperty.call(message, "vocIndex"))
                $root.lukuid.MetricValue.encode(message.vocIndex, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            if (message.tamper != null && Object.hasOwnProperty.call(message, "tamper"))
                writer.uint32(/* id 8, wireType 0 =*/64).bool(message.tamper);
            if (message.wakeEvent != null && Object.hasOwnProperty.call(message, "wakeEvent"))
                writer.uint32(/* id 9, wireType 0 =*/72).bool(message.wakeEvent);
            if (message.vbusPresent != null && Object.hasOwnProperty.call(message, "vbusPresent"))
                writer.uint32(/* id 10, wireType 0 =*/80).bool(message.vbusPresent);
            return writer;
        };

        /**
         * Encodes the specified EnvironmentRecordMin message, length delimited. Does not implicitly {@link lukuid.EnvironmentRecordMin.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.EnvironmentRecordMin
         * @static
         * @param {lukuid.IEnvironmentRecordMin} message EnvironmentRecordMin message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EnvironmentRecordMin.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an EnvironmentRecordMin message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.EnvironmentRecordMin
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.EnvironmentRecordMin} EnvironmentRecordMin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EnvironmentRecordMin.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.EnvironmentRecordMin();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.version = reader.string();
                        break;
                    }
                case 2: {
                        message.recordId = reader.string();
                        break;
                    }
                case 3: {
                        message.timestampUtc = reader.int64();
                        break;
                    }
                case 4: {
                        message.lux = $root.lukuid.MetricValue.decode(reader, reader.uint32());
                        break;
                    }
                case 5: {
                        message.tempC = $root.lukuid.MetricValue.decode(reader, reader.uint32());
                        break;
                    }
                case 6: {
                        message.humidityPct = $root.lukuid.MetricValue.decode(reader, reader.uint32());
                        break;
                    }
                case 7: {
                        message.vocIndex = $root.lukuid.MetricValue.decode(reader, reader.uint32());
                        break;
                    }
                case 8: {
                        message.tamper = reader.bool();
                        break;
                    }
                case 9: {
                        message.wakeEvent = reader.bool();
                        break;
                    }
                case 10: {
                        message.vbusPresent = reader.bool();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an EnvironmentRecordMin message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.EnvironmentRecordMin
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.EnvironmentRecordMin} EnvironmentRecordMin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EnvironmentRecordMin.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EnvironmentRecordMin message.
         * @function verify
         * @memberof lukuid.EnvironmentRecordMin
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EnvironmentRecordMin.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.version != null && message.hasOwnProperty("version"))
                if (!$util.isString(message.version))
                    return "version: string expected";
            if (message.recordId != null && message.hasOwnProperty("recordId"))
                if (!$util.isString(message.recordId))
                    return "recordId: string expected";
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (!$util.isInteger(message.timestampUtc) && !(message.timestampUtc && $util.isInteger(message.timestampUtc.low) && $util.isInteger(message.timestampUtc.high)))
                    return "timestampUtc: integer|Long expected";
            if (message.lux != null && message.hasOwnProperty("lux")) {
                let error = $root.lukuid.MetricValue.verify(message.lux);
                if (error)
                    return "lux." + error;
            }
            if (message.tempC != null && message.hasOwnProperty("tempC")) {
                let error = $root.lukuid.MetricValue.verify(message.tempC);
                if (error)
                    return "tempC." + error;
            }
            if (message.humidityPct != null && message.hasOwnProperty("humidityPct")) {
                let error = $root.lukuid.MetricValue.verify(message.humidityPct);
                if (error)
                    return "humidityPct." + error;
            }
            if (message.vocIndex != null && message.hasOwnProperty("vocIndex")) {
                let error = $root.lukuid.MetricValue.verify(message.vocIndex);
                if (error)
                    return "vocIndex." + error;
            }
            if (message.tamper != null && message.hasOwnProperty("tamper"))
                if (typeof message.tamper !== "boolean")
                    return "tamper: boolean expected";
            if (message.wakeEvent != null && message.hasOwnProperty("wakeEvent"))
                if (typeof message.wakeEvent !== "boolean")
                    return "wakeEvent: boolean expected";
            if (message.vbusPresent != null && message.hasOwnProperty("vbusPresent"))
                if (typeof message.vbusPresent !== "boolean")
                    return "vbusPresent: boolean expected";
            return null;
        };

        /**
         * Creates an EnvironmentRecordMin message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.EnvironmentRecordMin
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.EnvironmentRecordMin} EnvironmentRecordMin
         */
        EnvironmentRecordMin.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.EnvironmentRecordMin)
                return object;
            let message = new $root.lukuid.EnvironmentRecordMin();
            if (object.version != null)
                message.version = String(object.version);
            if (object.recordId != null)
                message.recordId = String(object.recordId);
            if (object.timestampUtc != null)
                if ($util.Long)
                    (message.timestampUtc = $util.Long.fromValue(object.timestampUtc)).unsigned = false;
                else if (typeof object.timestampUtc === "string")
                    message.timestampUtc = parseInt(object.timestampUtc, 10);
                else if (typeof object.timestampUtc === "number")
                    message.timestampUtc = object.timestampUtc;
                else if (typeof object.timestampUtc === "object")
                    message.timestampUtc = new $util.LongBits(object.timestampUtc.low >>> 0, object.timestampUtc.high >>> 0).toNumber();
            if (object.lux != null) {
                if (typeof object.lux !== "object")
                    throw TypeError(".lukuid.EnvironmentRecordMin.lux: object expected");
                message.lux = $root.lukuid.MetricValue.fromObject(object.lux);
            }
            if (object.tempC != null) {
                if (typeof object.tempC !== "object")
                    throw TypeError(".lukuid.EnvironmentRecordMin.tempC: object expected");
                message.tempC = $root.lukuid.MetricValue.fromObject(object.tempC);
            }
            if (object.humidityPct != null) {
                if (typeof object.humidityPct !== "object")
                    throw TypeError(".lukuid.EnvironmentRecordMin.humidityPct: object expected");
                message.humidityPct = $root.lukuid.MetricValue.fromObject(object.humidityPct);
            }
            if (object.vocIndex != null) {
                if (typeof object.vocIndex !== "object")
                    throw TypeError(".lukuid.EnvironmentRecordMin.vocIndex: object expected");
                message.vocIndex = $root.lukuid.MetricValue.fromObject(object.vocIndex);
            }
            if (object.tamper != null)
                message.tamper = Boolean(object.tamper);
            if (object.wakeEvent != null)
                message.wakeEvent = Boolean(object.wakeEvent);
            if (object.vbusPresent != null)
                message.vbusPresent = Boolean(object.vbusPresent);
            return message;
        };

        /**
         * Creates a plain object from an EnvironmentRecordMin message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.EnvironmentRecordMin
         * @static
         * @param {lukuid.EnvironmentRecordMin} message EnvironmentRecordMin
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EnvironmentRecordMin.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.version = "";
                object.recordId = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.timestampUtc = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.timestampUtc = options.longs === String ? "0" : 0;
                object.lux = null;
                object.tempC = null;
                object.humidityPct = null;
                object.vocIndex = null;
                object.tamper = false;
                object.wakeEvent = false;
                object.vbusPresent = false;
            }
            if (message.version != null && message.hasOwnProperty("version"))
                object.version = message.version;
            if (message.recordId != null && message.hasOwnProperty("recordId"))
                object.recordId = message.recordId;
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (typeof message.timestampUtc === "number")
                    object.timestampUtc = options.longs === String ? String(message.timestampUtc) : message.timestampUtc;
                else
                    object.timestampUtc = options.longs === String ? $util.Long.prototype.toString.call(message.timestampUtc) : options.longs === Number ? new $util.LongBits(message.timestampUtc.low >>> 0, message.timestampUtc.high >>> 0).toNumber() : message.timestampUtc;
            if (message.lux != null && message.hasOwnProperty("lux"))
                object.lux = $root.lukuid.MetricValue.toObject(message.lux, options);
            if (message.tempC != null && message.hasOwnProperty("tempC"))
                object.tempC = $root.lukuid.MetricValue.toObject(message.tempC, options);
            if (message.humidityPct != null && message.hasOwnProperty("humidityPct"))
                object.humidityPct = $root.lukuid.MetricValue.toObject(message.humidityPct, options);
            if (message.vocIndex != null && message.hasOwnProperty("vocIndex"))
                object.vocIndex = $root.lukuid.MetricValue.toObject(message.vocIndex, options);
            if (message.tamper != null && message.hasOwnProperty("tamper"))
                object.tamper = message.tamper;
            if (message.wakeEvent != null && message.hasOwnProperty("wakeEvent"))
                object.wakeEvent = message.wakeEvent;
            if (message.vbusPresent != null && message.hasOwnProperty("vbusPresent"))
                object.vbusPresent = message.vbusPresent;
            return object;
        };

        /**
         * Converts this EnvironmentRecordMin to JSON.
         * @function toJSON
         * @memberof lukuid.EnvironmentRecordMin
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EnvironmentRecordMin.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for EnvironmentRecordMin
         * @function getTypeUrl
         * @memberof lukuid.EnvironmentRecordMin
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        EnvironmentRecordMin.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.EnvironmentRecordMin";
        };

        return EnvironmentRecordMin;
    })();

    lukuid.DataEntry = (function() {

        /**
         * Properties of a DataEntry.
         * @memberof lukuid
         * @interface IDataEntry
         * @property {lukuid.IScanRecordMin|null} [scanMin] DataEntry scanMin
         * @property {lukuid.IEnvironmentRecordMin|null} [environmentMin] DataEntry environmentMin
         */

        /**
         * Constructs a new DataEntry.
         * @memberof lukuid
         * @classdesc Represents a DataEntry.
         * @implements IDataEntry
         * @constructor
         * @param {lukuid.IDataEntry=} [properties] Properties to set
         */
        function DataEntry(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * DataEntry scanMin.
         * @member {lukuid.IScanRecordMin|null|undefined} scanMin
         * @memberof lukuid.DataEntry
         * @instance
         */
        DataEntry.prototype.scanMin = null;

        /**
         * DataEntry environmentMin.
         * @member {lukuid.IEnvironmentRecordMin|null|undefined} environmentMin
         * @memberof lukuid.DataEntry
         * @instance
         */
        DataEntry.prototype.environmentMin = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * DataEntry minRecord.
         * @member {"scanMin"|"environmentMin"|undefined} minRecord
         * @memberof lukuid.DataEntry
         * @instance
         */
        Object.defineProperty(DataEntry.prototype, "minRecord", {
            get: $util.oneOfGetter($oneOfFields = ["scanMin", "environmentMin"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new DataEntry instance using the specified properties.
         * @function create
         * @memberof lukuid.DataEntry
         * @static
         * @param {lukuid.IDataEntry=} [properties] Properties to set
         * @returns {lukuid.DataEntry} DataEntry instance
         */
        DataEntry.create = function create(properties) {
            return new DataEntry(properties);
        };

        /**
         * Encodes the specified DataEntry message. Does not implicitly {@link lukuid.DataEntry.verify|verify} messages.
         * @function encode
         * @memberof lukuid.DataEntry
         * @static
         * @param {lukuid.IDataEntry} message DataEntry message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DataEntry.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.scanMin != null && Object.hasOwnProperty.call(message, "scanMin"))
                $root.lukuid.ScanRecordMin.encode(message.scanMin, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.environmentMin != null && Object.hasOwnProperty.call(message, "environmentMin"))
                $root.lukuid.EnvironmentRecordMin.encode(message.environmentMin, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified DataEntry message, length delimited. Does not implicitly {@link lukuid.DataEntry.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.DataEntry
         * @static
         * @param {lukuid.IDataEntry} message DataEntry message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DataEntry.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a DataEntry message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.DataEntry
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.DataEntry} DataEntry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DataEntry.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.DataEntry();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.scanMin = $root.lukuid.ScanRecordMin.decode(reader, reader.uint32());
                        break;
                    }
                case 2: {
                        message.environmentMin = $root.lukuid.EnvironmentRecordMin.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a DataEntry message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.DataEntry
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.DataEntry} DataEntry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DataEntry.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a DataEntry message.
         * @function verify
         * @memberof lukuid.DataEntry
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        DataEntry.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.scanMin != null && message.hasOwnProperty("scanMin")) {
                properties.minRecord = 1;
                {
                    let error = $root.lukuid.ScanRecordMin.verify(message.scanMin);
                    if (error)
                        return "scanMin." + error;
                }
            }
            if (message.environmentMin != null && message.hasOwnProperty("environmentMin")) {
                if (properties.minRecord === 1)
                    return "minRecord: multiple values";
                properties.minRecord = 1;
                {
                    let error = $root.lukuid.EnvironmentRecordMin.verify(message.environmentMin);
                    if (error)
                        return "environmentMin." + error;
                }
            }
            return null;
        };

        /**
         * Creates a DataEntry message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.DataEntry
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.DataEntry} DataEntry
         */
        DataEntry.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.DataEntry)
                return object;
            let message = new $root.lukuid.DataEntry();
            if (object.scanMin != null) {
                if (typeof object.scanMin !== "object")
                    throw TypeError(".lukuid.DataEntry.scanMin: object expected");
                message.scanMin = $root.lukuid.ScanRecordMin.fromObject(object.scanMin);
            }
            if (object.environmentMin != null) {
                if (typeof object.environmentMin !== "object")
                    throw TypeError(".lukuid.DataEntry.environmentMin: object expected");
                message.environmentMin = $root.lukuid.EnvironmentRecordMin.fromObject(object.environmentMin);
            }
            return message;
        };

        /**
         * Creates a plain object from a DataEntry message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.DataEntry
         * @static
         * @param {lukuid.DataEntry} message DataEntry
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        DataEntry.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (message.scanMin != null && message.hasOwnProperty("scanMin")) {
                object.scanMin = $root.lukuid.ScanRecordMin.toObject(message.scanMin, options);
                if (options.oneofs)
                    object.minRecord = "scanMin";
            }
            if (message.environmentMin != null && message.hasOwnProperty("environmentMin")) {
                object.environmentMin = $root.lukuid.EnvironmentRecordMin.toObject(message.environmentMin, options);
                if (options.oneofs)
                    object.minRecord = "environmentMin";
            }
            return object;
        };

        /**
         * Converts this DataEntry to JSON.
         * @function toJSON
         * @memberof lukuid.DataEntry
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        DataEntry.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for DataEntry
         * @function getTypeUrl
         * @memberof lukuid.DataEntry
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        DataEntry.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.DataEntry";
        };

        return DataEntry;
    })();

    lukuid.FetchResponse = (function() {

        /**
         * Properties of a FetchResponse.
         * @memberof lukuid
         * @interface IFetchResponse
         * @property {Array.<lukuid.IDataEntry>|null} [data] FetchResponse data
         */

        /**
         * Constructs a new FetchResponse.
         * @memberof lukuid
         * @classdesc Represents a FetchResponse.
         * @implements IFetchResponse
         * @constructor
         * @param {lukuid.IFetchResponse=} [properties] Properties to set
         */
        function FetchResponse(properties) {
            this.data = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * FetchResponse data.
         * @member {Array.<lukuid.IDataEntry>} data
         * @memberof lukuid.FetchResponse
         * @instance
         */
        FetchResponse.prototype.data = $util.emptyArray;

        /**
         * Creates a new FetchResponse instance using the specified properties.
         * @function create
         * @memberof lukuid.FetchResponse
         * @static
         * @param {lukuid.IFetchResponse=} [properties] Properties to set
         * @returns {lukuid.FetchResponse} FetchResponse instance
         */
        FetchResponse.create = function create(properties) {
            return new FetchResponse(properties);
        };

        /**
         * Encodes the specified FetchResponse message. Does not implicitly {@link lukuid.FetchResponse.verify|verify} messages.
         * @function encode
         * @memberof lukuid.FetchResponse
         * @static
         * @param {lukuid.IFetchResponse} message FetchResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FetchResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.data != null && message.data.length)
                for (let i = 0; i < message.data.length; ++i)
                    $root.lukuid.DataEntry.encode(message.data[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified FetchResponse message, length delimited. Does not implicitly {@link lukuid.FetchResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.FetchResponse
         * @static
         * @param {lukuid.IFetchResponse} message FetchResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FetchResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a FetchResponse message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.FetchResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.FetchResponse} FetchResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FetchResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.FetchResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.data && message.data.length))
                            message.data = [];
                        message.data.push($root.lukuid.DataEntry.decode(reader, reader.uint32()));
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a FetchResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.FetchResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.FetchResponse} FetchResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FetchResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a FetchResponse message.
         * @function verify
         * @memberof lukuid.FetchResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        FetchResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.data != null && message.hasOwnProperty("data")) {
                if (!Array.isArray(message.data))
                    return "data: array expected";
                for (let i = 0; i < message.data.length; ++i) {
                    let error = $root.lukuid.DataEntry.verify(message.data[i]);
                    if (error)
                        return "data." + error;
                }
            }
            return null;
        };

        /**
         * Creates a FetchResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.FetchResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.FetchResponse} FetchResponse
         */
        FetchResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.FetchResponse)
                return object;
            let message = new $root.lukuid.FetchResponse();
            if (object.data) {
                if (!Array.isArray(object.data))
                    throw TypeError(".lukuid.FetchResponse.data: array expected");
                message.data = [];
                for (let i = 0; i < object.data.length; ++i) {
                    if (typeof object.data[i] !== "object")
                        throw TypeError(".lukuid.FetchResponse.data: object expected");
                    message.data[i] = $root.lukuid.DataEntry.fromObject(object.data[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a FetchResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.FetchResponse
         * @static
         * @param {lukuid.FetchResponse} message FetchResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        FetchResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.data = [];
            if (message.data && message.data.length) {
                object.data = [];
                for (let j = 0; j < message.data.length; ++j)
                    object.data[j] = $root.lukuid.DataEntry.toObject(message.data[j], options);
            }
            return object;
        };

        /**
         * Converts this FetchResponse to JSON.
         * @function toJSON
         * @memberof lukuid.FetchResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        FetchResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for FetchResponse
         * @function getTypeUrl
         * @memberof lukuid.FetchResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FetchResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.FetchResponse";
        };

        return FetchResponse;
    })();

    lukuid.ScanPayload = (function() {

        /**
         * Properties of a ScanPayload.
         * @memberof lukuid
         * @interface IScanPayload
         * @property {number|Long|null} [ctr] ScanPayload ctr
         * @property {string|null} [id] ScanPayload id
         * @property {number|Long|null} [timestampUtc] ScanPayload timestampUtc
         * @property {number|Long|null} [uptimeUs] ScanPayload uptimeUs
         * @property {number|null} [temperatureC] ScanPayload temperatureC
         * @property {string|null} [nonce] ScanPayload nonce
         * @property {string|null} [firmware] ScanPayload firmware
         * @property {string|null} [genesisHash] ScanPayload genesisHash
         * @property {number|null} [tmp] ScanPayload tmp
         * @property {number|null} [hum] ScanPayload hum
         * @property {number|null} [rssi] ScanPayload rssi
         * @property {number|null} [jit] ScanPayload jit
         * @property {number|null} [lat] ScanPayload lat
         * @property {number|null} [dur] ScanPayload dur
         * @property {number|null} [vSag] ScanPayload vSag
         * @property {number|null} [vAvg] ScanPayload vAvg
         * @property {number|null} [pCnt] ScanPayload pCnt
         * @property {number|null} [avgDur] ScanPayload avgDur
         * @property {number|null} [scSync] ScanPayload scSync
         * @property {number|null} [upTimeM] ScanPayload upTimeM
         * @property {number|null} [vDrop] ScanPayload vDrop
         * @property {number|null} [rssiStd] ScanPayload rssiStd
         * @property {number|null} [vbus] ScanPayload vbus
         * @property {number|null} [clkVar] ScanPayload clkVar
         * @property {number|null} [drift] ScanPayload drift
         * @property {string|null} [hdxHistoCsv] ScanPayload hdxHistoCsv
         * @property {number|null} [scoreBio] ScanPayload scoreBio
         * @property {number|null} [scoreAuth] ScanPayload scoreAuth
         * @property {number|null} [scoreEnv] ScanPayload scoreEnv
         * @property {string|null} [metricsKeys] ScanPayload metricsKeys
         * @property {string|null} [scanVersion] ScanPayload scanVersion
         */

        /**
         * Constructs a new ScanPayload.
         * @memberof lukuid
         * @classdesc Represents a ScanPayload.
         * @implements IScanPayload
         * @constructor
         * @param {lukuid.IScanPayload=} [properties] Properties to set
         */
        function ScanPayload(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ScanPayload ctr.
         * @member {number|Long} ctr
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.ctr = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * ScanPayload id.
         * @member {string} id
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.id = "";

        /**
         * ScanPayload timestampUtc.
         * @member {number|Long} timestampUtc
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.timestampUtc = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * ScanPayload uptimeUs.
         * @member {number|Long} uptimeUs
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.uptimeUs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * ScanPayload temperatureC.
         * @member {number} temperatureC
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.temperatureC = 0;

        /**
         * ScanPayload nonce.
         * @member {string} nonce
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.nonce = "";

        /**
         * ScanPayload firmware.
         * @member {string} firmware
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.firmware = "";

        /**
         * ScanPayload genesisHash.
         * @member {string} genesisHash
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.genesisHash = "";

        /**
         * ScanPayload tmp.
         * @member {number} tmp
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.tmp = 0;

        /**
         * ScanPayload hum.
         * @member {number} hum
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.hum = 0;

        /**
         * ScanPayload rssi.
         * @member {number} rssi
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.rssi = 0;

        /**
         * ScanPayload jit.
         * @member {number} jit
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.jit = 0;

        /**
         * ScanPayload lat.
         * @member {number} lat
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.lat = 0;

        /**
         * ScanPayload dur.
         * @member {number} dur
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.dur = 0;

        /**
         * ScanPayload vSag.
         * @member {number} vSag
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.vSag = 0;

        /**
         * ScanPayload vAvg.
         * @member {number} vAvg
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.vAvg = 0;

        /**
         * ScanPayload pCnt.
         * @member {number} pCnt
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.pCnt = 0;

        /**
         * ScanPayload avgDur.
         * @member {number} avgDur
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.avgDur = 0;

        /**
         * ScanPayload scSync.
         * @member {number} scSync
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.scSync = 0;

        /**
         * ScanPayload upTimeM.
         * @member {number} upTimeM
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.upTimeM = 0;

        /**
         * ScanPayload vDrop.
         * @member {number} vDrop
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.vDrop = 0;

        /**
         * ScanPayload rssiStd.
         * @member {number} rssiStd
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.rssiStd = 0;

        /**
         * ScanPayload vbus.
         * @member {number} vbus
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.vbus = 0;

        /**
         * ScanPayload clkVar.
         * @member {number} clkVar
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.clkVar = 0;

        /**
         * ScanPayload drift.
         * @member {number} drift
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.drift = 0;

        /**
         * ScanPayload hdxHistoCsv.
         * @member {string} hdxHistoCsv
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.hdxHistoCsv = "";

        /**
         * ScanPayload scoreBio.
         * @member {number} scoreBio
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.scoreBio = 0;

        /**
         * ScanPayload scoreAuth.
         * @member {number} scoreAuth
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.scoreAuth = 0;

        /**
         * ScanPayload scoreEnv.
         * @member {number} scoreEnv
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.scoreEnv = 0;

        /**
         * ScanPayload metricsKeys.
         * @member {string} metricsKeys
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.metricsKeys = "";

        /**
         * ScanPayload scanVersion.
         * @member {string} scanVersion
         * @memberof lukuid.ScanPayload
         * @instance
         */
        ScanPayload.prototype.scanVersion = "";

        /**
         * Creates a new ScanPayload instance using the specified properties.
         * @function create
         * @memberof lukuid.ScanPayload
         * @static
         * @param {lukuid.IScanPayload=} [properties] Properties to set
         * @returns {lukuid.ScanPayload} ScanPayload instance
         */
        ScanPayload.create = function create(properties) {
            return new ScanPayload(properties);
        };

        /**
         * Encodes the specified ScanPayload message. Does not implicitly {@link lukuid.ScanPayload.verify|verify} messages.
         * @function encode
         * @memberof lukuid.ScanPayload
         * @static
         * @param {lukuid.IScanPayload} message ScanPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ScanPayload.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.ctr != null && Object.hasOwnProperty.call(message, "ctr"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.ctr);
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.id);
            if (message.timestampUtc != null && Object.hasOwnProperty.call(message, "timestampUtc"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.timestampUtc);
            if (message.uptimeUs != null && Object.hasOwnProperty.call(message, "uptimeUs"))
                writer.uint32(/* id 4, wireType 0 =*/32).int64(message.uptimeUs);
            if (message.temperatureC != null && Object.hasOwnProperty.call(message, "temperatureC"))
                writer.uint32(/* id 5, wireType 5 =*/45).float(message.temperatureC);
            if (message.nonce != null && Object.hasOwnProperty.call(message, "nonce"))
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.nonce);
            if (message.firmware != null && Object.hasOwnProperty.call(message, "firmware"))
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.firmware);
            if (message.tmp != null && Object.hasOwnProperty.call(message, "tmp"))
                writer.uint32(/* id 8, wireType 5 =*/69).float(message.tmp);
            if (message.hum != null && Object.hasOwnProperty.call(message, "hum"))
                writer.uint32(/* id 9, wireType 0 =*/72).uint32(message.hum);
            if (message.rssi != null && Object.hasOwnProperty.call(message, "rssi"))
                writer.uint32(/* id 10, wireType 0 =*/80).int32(message.rssi);
            if (message.jit != null && Object.hasOwnProperty.call(message, "jit"))
                writer.uint32(/* id 11, wireType 0 =*/88).uint32(message.jit);
            if (message.lat != null && Object.hasOwnProperty.call(message, "lat"))
                writer.uint32(/* id 12, wireType 0 =*/96).uint32(message.lat);
            if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
                writer.uint32(/* id 13, wireType 0 =*/104).uint32(message.dur);
            if (message.vSag != null && Object.hasOwnProperty.call(message, "vSag"))
                writer.uint32(/* id 14, wireType 0 =*/112).uint32(message.vSag);
            if (message.vAvg != null && Object.hasOwnProperty.call(message, "vAvg"))
                writer.uint32(/* id 15, wireType 0 =*/120).uint32(message.vAvg);
            if (message.pCnt != null && Object.hasOwnProperty.call(message, "pCnt"))
                writer.uint32(/* id 16, wireType 0 =*/128).uint32(message.pCnt);
            if (message.avgDur != null && Object.hasOwnProperty.call(message, "avgDur"))
                writer.uint32(/* id 17, wireType 0 =*/136).uint32(message.avgDur);
            if (message.scSync != null && Object.hasOwnProperty.call(message, "scSync"))
                writer.uint32(/* id 18, wireType 0 =*/144).uint32(message.scSync);
            if (message.upTimeM != null && Object.hasOwnProperty.call(message, "upTimeM"))
                writer.uint32(/* id 19, wireType 0 =*/152).uint32(message.upTimeM);
            if (message.vDrop != null && Object.hasOwnProperty.call(message, "vDrop"))
                writer.uint32(/* id 20, wireType 0 =*/160).uint32(message.vDrop);
            if (message.rssiStd != null && Object.hasOwnProperty.call(message, "rssiStd"))
                writer.uint32(/* id 21, wireType 5 =*/173).float(message.rssiStd);
            if (message.vbus != null && Object.hasOwnProperty.call(message, "vbus"))
                writer.uint32(/* id 22, wireType 0 =*/176).uint32(message.vbus);
            if (message.clkVar != null && Object.hasOwnProperty.call(message, "clkVar"))
                writer.uint32(/* id 23, wireType 0 =*/184).uint32(message.clkVar);
            if (message.drift != null && Object.hasOwnProperty.call(message, "drift"))
                writer.uint32(/* id 24, wireType 0 =*/192).int32(message.drift);
            if (message.hdxHistoCsv != null && Object.hasOwnProperty.call(message, "hdxHistoCsv"))
                writer.uint32(/* id 25, wireType 2 =*/202).string(message.hdxHistoCsv);
            if (message.scoreBio != null && Object.hasOwnProperty.call(message, "scoreBio"))
                writer.uint32(/* id 26, wireType 0 =*/208).uint32(message.scoreBio);
            if (message.scoreAuth != null && Object.hasOwnProperty.call(message, "scoreAuth"))
                writer.uint32(/* id 27, wireType 0 =*/216).uint32(message.scoreAuth);
            if (message.scoreEnv != null && Object.hasOwnProperty.call(message, "scoreEnv"))
                writer.uint32(/* id 28, wireType 0 =*/224).uint32(message.scoreEnv);
            if (message.metricsKeys != null && Object.hasOwnProperty.call(message, "metricsKeys"))
                writer.uint32(/* id 29, wireType 2 =*/234).string(message.metricsKeys);
            if (message.scanVersion != null && Object.hasOwnProperty.call(message, "scanVersion"))
                writer.uint32(/* id 30, wireType 2 =*/242).string(message.scanVersion);
            if (message.genesisHash != null && Object.hasOwnProperty.call(message, "genesisHash"))
                writer.uint32(/* id 31, wireType 2 =*/250).string(message.genesisHash);
            return writer;
        };

        /**
         * Encodes the specified ScanPayload message, length delimited. Does not implicitly {@link lukuid.ScanPayload.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.ScanPayload
         * @static
         * @param {lukuid.IScanPayload} message ScanPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ScanPayload.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ScanPayload message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.ScanPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.ScanPayload} ScanPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ScanPayload.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.ScanPayload();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ctr = reader.uint64();
                        break;
                    }
                case 2: {
                        message.id = reader.string();
                        break;
                    }
                case 3: {
                        message.timestampUtc = reader.int64();
                        break;
                    }
                case 4: {
                        message.uptimeUs = reader.int64();
                        break;
                    }
                case 5: {
                        message.temperatureC = reader.float();
                        break;
                    }
                case 6: {
                        message.nonce = reader.string();
                        break;
                    }
                case 7: {
                        message.firmware = reader.string();
                        break;
                    }
                case 31: {
                        message.genesisHash = reader.string();
                        break;
                    }
                case 8: {
                        message.tmp = reader.float();
                        break;
                    }
                case 9: {
                        message.hum = reader.uint32();
                        break;
                    }
                case 10: {
                        message.rssi = reader.int32();
                        break;
                    }
                case 11: {
                        message.jit = reader.uint32();
                        break;
                    }
                case 12: {
                        message.lat = reader.uint32();
                        break;
                    }
                case 13: {
                        message.dur = reader.uint32();
                        break;
                    }
                case 14: {
                        message.vSag = reader.uint32();
                        break;
                    }
                case 15: {
                        message.vAvg = reader.uint32();
                        break;
                    }
                case 16: {
                        message.pCnt = reader.uint32();
                        break;
                    }
                case 17: {
                        message.avgDur = reader.uint32();
                        break;
                    }
                case 18: {
                        message.scSync = reader.uint32();
                        break;
                    }
                case 19: {
                        message.upTimeM = reader.uint32();
                        break;
                    }
                case 20: {
                        message.vDrop = reader.uint32();
                        break;
                    }
                case 21: {
                        message.rssiStd = reader.float();
                        break;
                    }
                case 22: {
                        message.vbus = reader.uint32();
                        break;
                    }
                case 23: {
                        message.clkVar = reader.uint32();
                        break;
                    }
                case 24: {
                        message.drift = reader.int32();
                        break;
                    }
                case 25: {
                        message.hdxHistoCsv = reader.string();
                        break;
                    }
                case 26: {
                        message.scoreBio = reader.uint32();
                        break;
                    }
                case 27: {
                        message.scoreAuth = reader.uint32();
                        break;
                    }
                case 28: {
                        message.scoreEnv = reader.uint32();
                        break;
                    }
                case 29: {
                        message.metricsKeys = reader.string();
                        break;
                    }
                case 30: {
                        message.scanVersion = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ScanPayload message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.ScanPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.ScanPayload} ScanPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ScanPayload.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ScanPayload message.
         * @function verify
         * @memberof lukuid.ScanPayload
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ScanPayload.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.ctr != null && message.hasOwnProperty("ctr"))
                if (!$util.isInteger(message.ctr) && !(message.ctr && $util.isInteger(message.ctr.low) && $util.isInteger(message.ctr.high)))
                    return "ctr: integer|Long expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (!$util.isInteger(message.timestampUtc) && !(message.timestampUtc && $util.isInteger(message.timestampUtc.low) && $util.isInteger(message.timestampUtc.high)))
                    return "timestampUtc: integer|Long expected";
            if (message.uptimeUs != null && message.hasOwnProperty("uptimeUs"))
                if (!$util.isInteger(message.uptimeUs) && !(message.uptimeUs && $util.isInteger(message.uptimeUs.low) && $util.isInteger(message.uptimeUs.high)))
                    return "uptimeUs: integer|Long expected";
            if (message.temperatureC != null && message.hasOwnProperty("temperatureC"))
                if (typeof message.temperatureC !== "number")
                    return "temperatureC: number expected";
            if (message.nonce != null && message.hasOwnProperty("nonce"))
                if (!$util.isString(message.nonce))
                    return "nonce: string expected";
            if (message.firmware != null && message.hasOwnProperty("firmware"))
                if (!$util.isString(message.firmware))
                    return "firmware: string expected";
            if (message.genesisHash != null && message.hasOwnProperty("genesisHash"))
                if (!$util.isString(message.genesisHash))
                    return "genesisHash: string expected";
            if (message.tmp != null && message.hasOwnProperty("tmp"))
                if (typeof message.tmp !== "number")
                    return "tmp: number expected";
            if (message.hum != null && message.hasOwnProperty("hum"))
                if (!$util.isInteger(message.hum))
                    return "hum: integer expected";
            if (message.rssi != null && message.hasOwnProperty("rssi"))
                if (!$util.isInteger(message.rssi))
                    return "rssi: integer expected";
            if (message.jit != null && message.hasOwnProperty("jit"))
                if (!$util.isInteger(message.jit))
                    return "jit: integer expected";
            if (message.lat != null && message.hasOwnProperty("lat"))
                if (!$util.isInteger(message.lat))
                    return "lat: integer expected";
            if (message.dur != null && message.hasOwnProperty("dur"))
                if (!$util.isInteger(message.dur))
                    return "dur: integer expected";
            if (message.vSag != null && message.hasOwnProperty("vSag"))
                if (!$util.isInteger(message.vSag))
                    return "vSag: integer expected";
            if (message.vAvg != null && message.hasOwnProperty("vAvg"))
                if (!$util.isInteger(message.vAvg))
                    return "vAvg: integer expected";
            if (message.pCnt != null && message.hasOwnProperty("pCnt"))
                if (!$util.isInteger(message.pCnt))
                    return "pCnt: integer expected";
            if (message.avgDur != null && message.hasOwnProperty("avgDur"))
                if (!$util.isInteger(message.avgDur))
                    return "avgDur: integer expected";
            if (message.scSync != null && message.hasOwnProperty("scSync"))
                if (!$util.isInteger(message.scSync))
                    return "scSync: integer expected";
            if (message.upTimeM != null && message.hasOwnProperty("upTimeM"))
                if (!$util.isInteger(message.upTimeM))
                    return "upTimeM: integer expected";
            if (message.vDrop != null && message.hasOwnProperty("vDrop"))
                if (!$util.isInteger(message.vDrop))
                    return "vDrop: integer expected";
            if (message.rssiStd != null && message.hasOwnProperty("rssiStd"))
                if (typeof message.rssiStd !== "number")
                    return "rssiStd: number expected";
            if (message.vbus != null && message.hasOwnProperty("vbus"))
                if (!$util.isInteger(message.vbus))
                    return "vbus: integer expected";
            if (message.clkVar != null && message.hasOwnProperty("clkVar"))
                if (!$util.isInteger(message.clkVar))
                    return "clkVar: integer expected";
            if (message.drift != null && message.hasOwnProperty("drift"))
                if (!$util.isInteger(message.drift))
                    return "drift: integer expected";
            if (message.hdxHistoCsv != null && message.hasOwnProperty("hdxHistoCsv"))
                if (!$util.isString(message.hdxHistoCsv))
                    return "hdxHistoCsv: string expected";
            if (message.scoreBio != null && message.hasOwnProperty("scoreBio"))
                if (!$util.isInteger(message.scoreBio))
                    return "scoreBio: integer expected";
            if (message.scoreAuth != null && message.hasOwnProperty("scoreAuth"))
                if (!$util.isInteger(message.scoreAuth))
                    return "scoreAuth: integer expected";
            if (message.scoreEnv != null && message.hasOwnProperty("scoreEnv"))
                if (!$util.isInteger(message.scoreEnv))
                    return "scoreEnv: integer expected";
            if (message.metricsKeys != null && message.hasOwnProperty("metricsKeys"))
                if (!$util.isString(message.metricsKeys))
                    return "metricsKeys: string expected";
            if (message.scanVersion != null && message.hasOwnProperty("scanVersion"))
                if (!$util.isString(message.scanVersion))
                    return "scanVersion: string expected";
            return null;
        };

        /**
         * Creates a ScanPayload message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.ScanPayload
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.ScanPayload} ScanPayload
         */
        ScanPayload.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.ScanPayload)
                return object;
            let message = new $root.lukuid.ScanPayload();
            if (object.ctr != null)
                if ($util.Long)
                    (message.ctr = $util.Long.fromValue(object.ctr)).unsigned = true;
                else if (typeof object.ctr === "string")
                    message.ctr = parseInt(object.ctr, 10);
                else if (typeof object.ctr === "number")
                    message.ctr = object.ctr;
                else if (typeof object.ctr === "object")
                    message.ctr = new $util.LongBits(object.ctr.low >>> 0, object.ctr.high >>> 0).toNumber(true);
            if (object.id != null)
                message.id = String(object.id);
            if (object.timestampUtc != null)
                if ($util.Long)
                    (message.timestampUtc = $util.Long.fromValue(object.timestampUtc)).unsigned = false;
                else if (typeof object.timestampUtc === "string")
                    message.timestampUtc = parseInt(object.timestampUtc, 10);
                else if (typeof object.timestampUtc === "number")
                    message.timestampUtc = object.timestampUtc;
                else if (typeof object.timestampUtc === "object")
                    message.timestampUtc = new $util.LongBits(object.timestampUtc.low >>> 0, object.timestampUtc.high >>> 0).toNumber();
            if (object.uptimeUs != null)
                if ($util.Long)
                    (message.uptimeUs = $util.Long.fromValue(object.uptimeUs)).unsigned = false;
                else if (typeof object.uptimeUs === "string")
                    message.uptimeUs = parseInt(object.uptimeUs, 10);
                else if (typeof object.uptimeUs === "number")
                    message.uptimeUs = object.uptimeUs;
                else if (typeof object.uptimeUs === "object")
                    message.uptimeUs = new $util.LongBits(object.uptimeUs.low >>> 0, object.uptimeUs.high >>> 0).toNumber();
            if (object.temperatureC != null)
                message.temperatureC = Number(object.temperatureC);
            if (object.nonce != null)
                message.nonce = String(object.nonce);
            if (object.firmware != null)
                message.firmware = String(object.firmware);
            if (object.genesisHash != null)
                message.genesisHash = String(object.genesisHash);
            if (object.tmp != null)
                message.tmp = Number(object.tmp);
            if (object.hum != null)
                message.hum = object.hum >>> 0;
            if (object.rssi != null)
                message.rssi = object.rssi | 0;
            if (object.jit != null)
                message.jit = object.jit >>> 0;
            if (object.lat != null)
                message.lat = object.lat >>> 0;
            if (object.dur != null)
                message.dur = object.dur >>> 0;
            if (object.vSag != null)
                message.vSag = object.vSag >>> 0;
            if (object.vAvg != null)
                message.vAvg = object.vAvg >>> 0;
            if (object.pCnt != null)
                message.pCnt = object.pCnt >>> 0;
            if (object.avgDur != null)
                message.avgDur = object.avgDur >>> 0;
            if (object.scSync != null)
                message.scSync = object.scSync >>> 0;
            if (object.upTimeM != null)
                message.upTimeM = object.upTimeM >>> 0;
            if (object.vDrop != null)
                message.vDrop = object.vDrop >>> 0;
            if (object.rssiStd != null)
                message.rssiStd = Number(object.rssiStd);
            if (object.vbus != null)
                message.vbus = object.vbus >>> 0;
            if (object.clkVar != null)
                message.clkVar = object.clkVar >>> 0;
            if (object.drift != null)
                message.drift = object.drift | 0;
            if (object.hdxHistoCsv != null)
                message.hdxHistoCsv = String(object.hdxHistoCsv);
            if (object.scoreBio != null)
                message.scoreBio = object.scoreBio >>> 0;
            if (object.scoreAuth != null)
                message.scoreAuth = object.scoreAuth >>> 0;
            if (object.scoreEnv != null)
                message.scoreEnv = object.scoreEnv >>> 0;
            if (object.metricsKeys != null)
                message.metricsKeys = String(object.metricsKeys);
            if (object.scanVersion != null)
                message.scanVersion = String(object.scanVersion);
            return message;
        };

        /**
         * Creates a plain object from a ScanPayload message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.ScanPayload
         * @static
         * @param {lukuid.ScanPayload} message ScanPayload
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ScanPayload.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.ctr = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.ctr = options.longs === String ? "0" : 0;
                object.id = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.timestampUtc = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.timestampUtc = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.uptimeUs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.uptimeUs = options.longs === String ? "0" : 0;
                object.temperatureC = 0;
                object.nonce = "";
                object.firmware = "";
                object.tmp = 0;
                object.hum = 0;
                object.rssi = 0;
                object.jit = 0;
                object.lat = 0;
                object.dur = 0;
                object.vSag = 0;
                object.vAvg = 0;
                object.pCnt = 0;
                object.avgDur = 0;
                object.scSync = 0;
                object.upTimeM = 0;
                object.vDrop = 0;
                object.rssiStd = 0;
                object.vbus = 0;
                object.clkVar = 0;
                object.drift = 0;
                object.hdxHistoCsv = "";
                object.scoreBio = 0;
                object.scoreAuth = 0;
                object.scoreEnv = 0;
                object.metricsKeys = "";
                object.scanVersion = "";
                object.genesisHash = "";
            }
            if (message.ctr != null && message.hasOwnProperty("ctr"))
                if (typeof message.ctr === "number")
                    object.ctr = options.longs === String ? String(message.ctr) : message.ctr;
                else
                    object.ctr = options.longs === String ? $util.Long.prototype.toString.call(message.ctr) : options.longs === Number ? new $util.LongBits(message.ctr.low >>> 0, message.ctr.high >>> 0).toNumber(true) : message.ctr;
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (typeof message.timestampUtc === "number")
                    object.timestampUtc = options.longs === String ? String(message.timestampUtc) : message.timestampUtc;
                else
                    object.timestampUtc = options.longs === String ? $util.Long.prototype.toString.call(message.timestampUtc) : options.longs === Number ? new $util.LongBits(message.timestampUtc.low >>> 0, message.timestampUtc.high >>> 0).toNumber() : message.timestampUtc;
            if (message.uptimeUs != null && message.hasOwnProperty("uptimeUs"))
                if (typeof message.uptimeUs === "number")
                    object.uptimeUs = options.longs === String ? String(message.uptimeUs) : message.uptimeUs;
                else
                    object.uptimeUs = options.longs === String ? $util.Long.prototype.toString.call(message.uptimeUs) : options.longs === Number ? new $util.LongBits(message.uptimeUs.low >>> 0, message.uptimeUs.high >>> 0).toNumber() : message.uptimeUs;
            if (message.temperatureC != null && message.hasOwnProperty("temperatureC"))
                object.temperatureC = options.json && !isFinite(message.temperatureC) ? String(message.temperatureC) : message.temperatureC;
            if (message.nonce != null && message.hasOwnProperty("nonce"))
                object.nonce = message.nonce;
            if (message.firmware != null && message.hasOwnProperty("firmware"))
                object.firmware = message.firmware;
            if (message.tmp != null && message.hasOwnProperty("tmp"))
                object.tmp = options.json && !isFinite(message.tmp) ? String(message.tmp) : message.tmp;
            if (message.hum != null && message.hasOwnProperty("hum"))
                object.hum = message.hum;
            if (message.rssi != null && message.hasOwnProperty("rssi"))
                object.rssi = message.rssi;
            if (message.jit != null && message.hasOwnProperty("jit"))
                object.jit = message.jit;
            if (message.lat != null && message.hasOwnProperty("lat"))
                object.lat = message.lat;
            if (message.dur != null && message.hasOwnProperty("dur"))
                object.dur = message.dur;
            if (message.vSag != null && message.hasOwnProperty("vSag"))
                object.vSag = message.vSag;
            if (message.vAvg != null && message.hasOwnProperty("vAvg"))
                object.vAvg = message.vAvg;
            if (message.pCnt != null && message.hasOwnProperty("pCnt"))
                object.pCnt = message.pCnt;
            if (message.avgDur != null && message.hasOwnProperty("avgDur"))
                object.avgDur = message.avgDur;
            if (message.scSync != null && message.hasOwnProperty("scSync"))
                object.scSync = message.scSync;
            if (message.upTimeM != null && message.hasOwnProperty("upTimeM"))
                object.upTimeM = message.upTimeM;
            if (message.vDrop != null && message.hasOwnProperty("vDrop"))
                object.vDrop = message.vDrop;
            if (message.rssiStd != null && message.hasOwnProperty("rssiStd"))
                object.rssiStd = options.json && !isFinite(message.rssiStd) ? String(message.rssiStd) : message.rssiStd;
            if (message.vbus != null && message.hasOwnProperty("vbus"))
                object.vbus = message.vbus;
            if (message.clkVar != null && message.hasOwnProperty("clkVar"))
                object.clkVar = message.clkVar;
            if (message.drift != null && message.hasOwnProperty("drift"))
                object.drift = message.drift;
            if (message.hdxHistoCsv != null && message.hasOwnProperty("hdxHistoCsv"))
                object.hdxHistoCsv = message.hdxHistoCsv;
            if (message.scoreBio != null && message.hasOwnProperty("scoreBio"))
                object.scoreBio = message.scoreBio;
            if (message.scoreAuth != null && message.hasOwnProperty("scoreAuth"))
                object.scoreAuth = message.scoreAuth;
            if (message.scoreEnv != null && message.hasOwnProperty("scoreEnv"))
                object.scoreEnv = message.scoreEnv;
            if (message.metricsKeys != null && message.hasOwnProperty("metricsKeys"))
                object.metricsKeys = message.metricsKeys;
            if (message.scanVersion != null && message.hasOwnProperty("scanVersion"))
                object.scanVersion = message.scanVersion;
            if (message.genesisHash != null && message.hasOwnProperty("genesisHash"))
                object.genesisHash = message.genesisHash;
            return object;
        };

        /**
         * Converts this ScanPayload to JSON.
         * @function toJSON
         * @memberof lukuid.ScanPayload
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ScanPayload.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ScanPayload
         * @function getTypeUrl
         * @memberof lukuid.ScanPayload
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ScanPayload.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.ScanPayload";
        };

        return ScanPayload;
    })();

    lukuid.DeviceInfo = (function() {

        /**
         * Properties of a DeviceInfo.
         * @memberof lukuid
         * @interface IDeviceInfo
         * @property {string|null} [deviceId] DeviceInfo deviceId
         * @property {Uint8Array|null} [publicKey] DeviceInfo publicKey
         */

        /**
         * Constructs a new DeviceInfo.
         * @memberof lukuid
         * @classdesc Represents a DeviceInfo.
         * @implements IDeviceInfo
         * @constructor
         * @param {lukuid.IDeviceInfo=} [properties] Properties to set
         */
        function DeviceInfo(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * DeviceInfo deviceId.
         * @member {string} deviceId
         * @memberof lukuid.DeviceInfo
         * @instance
         */
        DeviceInfo.prototype.deviceId = "";

        /**
         * DeviceInfo publicKey.
         * @member {Uint8Array} publicKey
         * @memberof lukuid.DeviceInfo
         * @instance
         */
        DeviceInfo.prototype.publicKey = $util.newBuffer([]);

        /**
         * Creates a new DeviceInfo instance using the specified properties.
         * @function create
         * @memberof lukuid.DeviceInfo
         * @static
         * @param {lukuid.IDeviceInfo=} [properties] Properties to set
         * @returns {lukuid.DeviceInfo} DeviceInfo instance
         */
        DeviceInfo.create = function create(properties) {
            return new DeviceInfo(properties);
        };

        /**
         * Encodes the specified DeviceInfo message. Does not implicitly {@link lukuid.DeviceInfo.verify|verify} messages.
         * @function encode
         * @memberof lukuid.DeviceInfo
         * @static
         * @param {lukuid.IDeviceInfo} message DeviceInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DeviceInfo.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.deviceId);
            if (message.publicKey != null && Object.hasOwnProperty.call(message, "publicKey"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.publicKey);
            return writer;
        };

        /**
         * Encodes the specified DeviceInfo message, length delimited. Does not implicitly {@link lukuid.DeviceInfo.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.DeviceInfo
         * @static
         * @param {lukuid.IDeviceInfo} message DeviceInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DeviceInfo.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a DeviceInfo message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.DeviceInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.DeviceInfo} DeviceInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DeviceInfo.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.DeviceInfo();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.deviceId = reader.string();
                        break;
                    }
                case 2: {
                        message.publicKey = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a DeviceInfo message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.DeviceInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.DeviceInfo} DeviceInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DeviceInfo.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a DeviceInfo message.
         * @function verify
         * @memberof lukuid.DeviceInfo
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        DeviceInfo.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.deviceId != null && message.hasOwnProperty("deviceId"))
                if (!$util.isString(message.deviceId))
                    return "deviceId: string expected";
            if (message.publicKey != null && message.hasOwnProperty("publicKey"))
                if (!(message.publicKey && typeof message.publicKey.length === "number" || $util.isString(message.publicKey)))
                    return "publicKey: buffer expected";
            return null;
        };

        /**
         * Creates a DeviceInfo message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.DeviceInfo
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.DeviceInfo} DeviceInfo
         */
        DeviceInfo.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.DeviceInfo)
                return object;
            let message = new $root.lukuid.DeviceInfo();
            if (object.deviceId != null)
                message.deviceId = String(object.deviceId);
            if (object.publicKey != null)
                if (typeof object.publicKey === "string")
                    $util.base64.decode(object.publicKey, message.publicKey = $util.newBuffer($util.base64.length(object.publicKey)), 0);
                else if (object.publicKey.length >= 0)
                    message.publicKey = object.publicKey;
            return message;
        };

        /**
         * Creates a plain object from a DeviceInfo message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.DeviceInfo
         * @static
         * @param {lukuid.DeviceInfo} message DeviceInfo
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        DeviceInfo.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.deviceId = "";
                if (options.bytes === String)
                    object.publicKey = "";
                else {
                    object.publicKey = [];
                    if (options.bytes !== Array)
                        object.publicKey = $util.newBuffer(object.publicKey);
                }
            }
            if (message.deviceId != null && message.hasOwnProperty("deviceId"))
                object.deviceId = message.deviceId;
            if (message.publicKey != null && message.hasOwnProperty("publicKey"))
                object.publicKey = options.bytes === String ? $util.base64.encode(message.publicKey, 0, message.publicKey.length) : options.bytes === Array ? Array.prototype.slice.call(message.publicKey) : message.publicKey;
            return object;
        };

        /**
         * Converts this DeviceInfo to JSON.
         * @function toJSON
         * @memberof lukuid.DeviceInfo
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        DeviceInfo.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for DeviceInfo
         * @function getTypeUrl
         * @memberof lukuid.DeviceInfo
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        DeviceInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.DeviceInfo";
        };

        return DeviceInfo;
    })();

    lukuid.ManufacturerInfo = (function() {

        /**
         * Properties of a ManufacturerInfo.
         * @memberof lukuid
         * @interface IManufacturerInfo
         * @property {Uint8Array|null} [signature] ManufacturerInfo signature
         * @property {Uint8Array|null} [publicKey] ManufacturerInfo publicKey
         */

        /**
         * Constructs a new ManufacturerInfo.
         * @memberof lukuid
         * @classdesc Represents a ManufacturerInfo.
         * @implements IManufacturerInfo
         * @constructor
         * @param {lukuid.IManufacturerInfo=} [properties] Properties to set
         */
        function ManufacturerInfo(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ManufacturerInfo signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.ManufacturerInfo
         * @instance
         */
        ManufacturerInfo.prototype.signature = $util.newBuffer([]);

        /**
         * ManufacturerInfo publicKey.
         * @member {Uint8Array} publicKey
         * @memberof lukuid.ManufacturerInfo
         * @instance
         */
        ManufacturerInfo.prototype.publicKey = $util.newBuffer([]);

        /**
         * Creates a new ManufacturerInfo instance using the specified properties.
         * @function create
         * @memberof lukuid.ManufacturerInfo
         * @static
         * @param {lukuid.IManufacturerInfo=} [properties] Properties to set
         * @returns {lukuid.ManufacturerInfo} ManufacturerInfo instance
         */
        ManufacturerInfo.create = function create(properties) {
            return new ManufacturerInfo(properties);
        };

        /**
         * Encodes the specified ManufacturerInfo message. Does not implicitly {@link lukuid.ManufacturerInfo.verify|verify} messages.
         * @function encode
         * @memberof lukuid.ManufacturerInfo
         * @static
         * @param {lukuid.IManufacturerInfo} message ManufacturerInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ManufacturerInfo.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.signature);
            if (message.publicKey != null && Object.hasOwnProperty.call(message, "publicKey"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.publicKey);
            return writer;
        };

        /**
         * Encodes the specified ManufacturerInfo message, length delimited. Does not implicitly {@link lukuid.ManufacturerInfo.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.ManufacturerInfo
         * @static
         * @param {lukuid.IManufacturerInfo} message ManufacturerInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ManufacturerInfo.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ManufacturerInfo message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.ManufacturerInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.ManufacturerInfo} ManufacturerInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ManufacturerInfo.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.ManufacturerInfo();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 2: {
                        message.publicKey = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ManufacturerInfo message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.ManufacturerInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.ManufacturerInfo} ManufacturerInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ManufacturerInfo.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ManufacturerInfo message.
         * @function verify
         * @memberof lukuid.ManufacturerInfo
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ManufacturerInfo.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            if (message.publicKey != null && message.hasOwnProperty("publicKey"))
                if (!(message.publicKey && typeof message.publicKey.length === "number" || $util.isString(message.publicKey)))
                    return "publicKey: buffer expected";
            return null;
        };

        /**
         * Creates a ManufacturerInfo message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.ManufacturerInfo
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.ManufacturerInfo} ManufacturerInfo
         */
        ManufacturerInfo.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.ManufacturerInfo)
                return object;
            let message = new $root.lukuid.ManufacturerInfo();
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.publicKey != null)
                if (typeof object.publicKey === "string")
                    $util.base64.decode(object.publicKey, message.publicKey = $util.newBuffer($util.base64.length(object.publicKey)), 0);
                else if (object.publicKey.length >= 0)
                    message.publicKey = object.publicKey;
            return message;
        };

        /**
         * Creates a plain object from a ManufacturerInfo message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.ManufacturerInfo
         * @static
         * @param {lukuid.ManufacturerInfo} message ManufacturerInfo
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ManufacturerInfo.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
                if (options.bytes === String)
                    object.publicKey = "";
                else {
                    object.publicKey = [];
                    if (options.bytes !== Array)
                        object.publicKey = $util.newBuffer(object.publicKey);
                }
            }
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            if (message.publicKey != null && message.hasOwnProperty("publicKey"))
                object.publicKey = options.bytes === String ? $util.base64.encode(message.publicKey, 0, message.publicKey.length) : options.bytes === Array ? Array.prototype.slice.call(message.publicKey) : message.publicKey;
            return object;
        };

        /**
         * Converts this ManufacturerInfo to JSON.
         * @function toJSON
         * @memberof lukuid.ManufacturerInfo
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ManufacturerInfo.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ManufacturerInfo
         * @function getTypeUrl
         * @memberof lukuid.ManufacturerInfo
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ManufacturerInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.ManufacturerInfo";
        };

        return ManufacturerInfo;
    })();

    lukuid.Identity = (function() {

        /**
         * Properties of an Identity.
         * @memberof lukuid
         * @interface IIdentity
         * @property {number|Long|null} [identityVersion] Identity identityVersion
         * @property {string|null} [dacSerial] Identity dacSerial
         * @property {string|null} [slacSerial] Identity slacSerial
         * @property {number|Long|null} [lastSyncUtc] Identity lastSyncUtc
         * @property {Uint8Array|null} [signature] Identity signature
         * @property {Uint8Array|null} [dacDer] Identity dacDer
         * @property {Uint8Array|null} [slacDer] Identity slacDer
         * @property {Uint8Array|null} [attestationManufacturerDer] Identity attestationManufacturerDer
         * @property {Uint8Array|null} [attestationIntermediateDer] Identity attestationIntermediateDer
         * @property {string|null} [attestationRootFingerprint] Identity attestationRootFingerprint
         * @property {Uint8Array|null} [heartbeatDer] Identity heartbeatDer
         * @property {Uint8Array|null} [heartbeatIntermediateDer] Identity heartbeatIntermediateDer
         * @property {string|null} [heartbeatRootFingerprint] Identity heartbeatRootFingerprint
         * @property {string|null} [alg] Identity alg
         */

        /**
         * Constructs a new Identity.
         * @memberof lukuid
         * @classdesc Represents an Identity.
         * @implements IIdentity
         * @constructor
         * @param {lukuid.IIdentity=} [properties] Properties to set
         */
        function Identity(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Identity identityVersion.
         * @member {number|Long} identityVersion
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.identityVersion = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Identity dacSerial.
         * @member {string} dacSerial
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.dacSerial = "";

        /**
         * Identity slacSerial.
         * @member {string} slacSerial
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.slacSerial = "";

        /**
         * Identity lastSyncUtc.
         * @member {number|Long} lastSyncUtc
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.lastSyncUtc = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Identity signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.signature = $util.newBuffer([]);

        /**
         * Identity dacDer.
         * @member {Uint8Array} dacDer
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.dacDer = $util.newBuffer([]);

        /**
         * Identity slacDer.
         * @member {Uint8Array} slacDer
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.slacDer = $util.newBuffer([]);

        /**
         * Identity attestationManufacturerDer.
         * @member {Uint8Array} attestationManufacturerDer
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.attestationManufacturerDer = $util.newBuffer([]);

        /**
         * Identity attestationIntermediateDer.
         * @member {Uint8Array} attestationIntermediateDer
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.attestationIntermediateDer = $util.newBuffer([]);

        /**
         * Identity attestationRootFingerprint.
         * @member {string} attestationRootFingerprint
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.attestationRootFingerprint = "";

        /**
         * Identity heartbeatDer.
         * @member {Uint8Array} heartbeatDer
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.heartbeatDer = $util.newBuffer([]);

        /**
         * Identity heartbeatIntermediateDer.
         * @member {Uint8Array} heartbeatIntermediateDer
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.heartbeatIntermediateDer = $util.newBuffer([]);

        /**
         * Identity heartbeatRootFingerprint.
         * @member {string} heartbeatRootFingerprint
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.heartbeatRootFingerprint = "";

        /**
         * Identity alg.
         * @member {string} alg
         * @memberof lukuid.Identity
         * @instance
         */
        Identity.prototype.alg = "";

        /**
         * Creates a new Identity instance using the specified properties.
         * @function create
         * @memberof lukuid.Identity
         * @static
         * @param {lukuid.IIdentity=} [properties] Properties to set
         * @returns {lukuid.Identity} Identity instance
         */
        Identity.create = function create(properties) {
            return new Identity(properties);
        };

        /**
         * Encodes the specified Identity message. Does not implicitly {@link lukuid.Identity.verify|verify} messages.
         * @function encode
         * @memberof lukuid.Identity
         * @static
         * @param {lukuid.IIdentity} message Identity message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Identity.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.identityVersion != null && Object.hasOwnProperty.call(message, "identityVersion"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.identityVersion);
            if (message.dacSerial != null && Object.hasOwnProperty.call(message, "dacSerial"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.dacSerial);
            if (message.slacSerial != null && Object.hasOwnProperty.call(message, "slacSerial"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.slacSerial);
            if (message.lastSyncUtc != null && Object.hasOwnProperty.call(message, "lastSyncUtc"))
                writer.uint32(/* id 4, wireType 0 =*/32).int64(message.lastSyncUtc);
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 5, wireType 2 =*/42).bytes(message.signature);
            if (message.dacDer != null && Object.hasOwnProperty.call(message, "dacDer"))
                writer.uint32(/* id 6, wireType 2 =*/50).bytes(message.dacDer);
            if (message.slacDer != null && Object.hasOwnProperty.call(message, "slacDer"))
                writer.uint32(/* id 7, wireType 2 =*/58).bytes(message.slacDer);
            if (message.attestationManufacturerDer != null && Object.hasOwnProperty.call(message, "attestationManufacturerDer"))
                writer.uint32(/* id 8, wireType 2 =*/66).bytes(message.attestationManufacturerDer);
            if (message.attestationIntermediateDer != null && Object.hasOwnProperty.call(message, "attestationIntermediateDer"))
                writer.uint32(/* id 9, wireType 2 =*/74).bytes(message.attestationIntermediateDer);
            if (message.attestationRootFingerprint != null && Object.hasOwnProperty.call(message, "attestationRootFingerprint"))
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.attestationRootFingerprint);
            if (message.heartbeatDer != null && Object.hasOwnProperty.call(message, "heartbeatDer"))
                writer.uint32(/* id 11, wireType 2 =*/90).bytes(message.heartbeatDer);
            if (message.heartbeatIntermediateDer != null && Object.hasOwnProperty.call(message, "heartbeatIntermediateDer"))
                writer.uint32(/* id 12, wireType 2 =*/98).bytes(message.heartbeatIntermediateDer);
            if (message.heartbeatRootFingerprint != null && Object.hasOwnProperty.call(message, "heartbeatRootFingerprint"))
                writer.uint32(/* id 13, wireType 2 =*/106).string(message.heartbeatRootFingerprint);
            if (message.alg != null && Object.hasOwnProperty.call(message, "alg"))
                writer.uint32(/* id 14, wireType 2 =*/114).string(message.alg);
            return writer;
        };

        /**
         * Encodes the specified Identity message, length delimited. Does not implicitly {@link lukuid.Identity.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.Identity
         * @static
         * @param {lukuid.IIdentity} message Identity message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Identity.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Identity message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.Identity
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.Identity} Identity
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Identity.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.Identity();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.identityVersion = reader.uint64();
                        break;
                    }
                case 2: {
                        message.dacSerial = reader.string();
                        break;
                    }
                case 3: {
                        message.slacSerial = reader.string();
                        break;
                    }
                case 4: {
                        message.lastSyncUtc = reader.int64();
                        break;
                    }
                case 5: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 6: {
                        message.dacDer = reader.bytes();
                        break;
                    }
                case 7: {
                        message.slacDer = reader.bytes();
                        break;
                    }
                case 8: {
                        message.attestationManufacturerDer = reader.bytes();
                        break;
                    }
                case 9: {
                        message.attestationIntermediateDer = reader.bytes();
                        break;
                    }
                case 10: {
                        message.attestationRootFingerprint = reader.string();
                        break;
                    }
                case 11: {
                        message.heartbeatDer = reader.bytes();
                        break;
                    }
                case 12: {
                        message.heartbeatIntermediateDer = reader.bytes();
                        break;
                    }
                case 13: {
                        message.heartbeatRootFingerprint = reader.string();
                        break;
                    }
                case 14: {
                        message.alg = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an Identity message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.Identity
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.Identity} Identity
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Identity.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Identity message.
         * @function verify
         * @memberof lukuid.Identity
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Identity.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.identityVersion != null && message.hasOwnProperty("identityVersion"))
                if (!$util.isInteger(message.identityVersion) && !(message.identityVersion && $util.isInteger(message.identityVersion.low) && $util.isInteger(message.identityVersion.high)))
                    return "identityVersion: integer|Long expected";
            if (message.dacSerial != null && message.hasOwnProperty("dacSerial"))
                if (!$util.isString(message.dacSerial))
                    return "dacSerial: string expected";
            if (message.slacSerial != null && message.hasOwnProperty("slacSerial"))
                if (!$util.isString(message.slacSerial))
                    return "slacSerial: string expected";
            if (message.lastSyncUtc != null && message.hasOwnProperty("lastSyncUtc"))
                if (!$util.isInteger(message.lastSyncUtc) && !(message.lastSyncUtc && $util.isInteger(message.lastSyncUtc.low) && $util.isInteger(message.lastSyncUtc.high)))
                    return "lastSyncUtc: integer|Long expected";
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            if (message.dacDer != null && message.hasOwnProperty("dacDer"))
                if (!(message.dacDer && typeof message.dacDer.length === "number" || $util.isString(message.dacDer)))
                    return "dacDer: buffer expected";
            if (message.slacDer != null && message.hasOwnProperty("slacDer"))
                if (!(message.slacDer && typeof message.slacDer.length === "number" || $util.isString(message.slacDer)))
                    return "slacDer: buffer expected";
            if (message.attestationManufacturerDer != null && message.hasOwnProperty("attestationManufacturerDer"))
                if (!(message.attestationManufacturerDer && typeof message.attestationManufacturerDer.length === "number" || $util.isString(message.attestationManufacturerDer)))
                    return "attestationManufacturerDer: buffer expected";
            if (message.attestationIntermediateDer != null && message.hasOwnProperty("attestationIntermediateDer"))
                if (!(message.attestationIntermediateDer && typeof message.attestationIntermediateDer.length === "number" || $util.isString(message.attestationIntermediateDer)))
                    return "attestationIntermediateDer: buffer expected";
            if (message.attestationRootFingerprint != null && message.hasOwnProperty("attestationRootFingerprint"))
                if (!$util.isString(message.attestationRootFingerprint))
                    return "attestationRootFingerprint: string expected";
            if (message.heartbeatDer != null && message.hasOwnProperty("heartbeatDer"))
                if (!(message.heartbeatDer && typeof message.heartbeatDer.length === "number" || $util.isString(message.heartbeatDer)))
                    return "heartbeatDer: buffer expected";
            if (message.heartbeatIntermediateDer != null && message.hasOwnProperty("heartbeatIntermediateDer"))
                if (!(message.heartbeatIntermediateDer && typeof message.heartbeatIntermediateDer.length === "number" || $util.isString(message.heartbeatIntermediateDer)))
                    return "heartbeatIntermediateDer: buffer expected";
            if (message.heartbeatRootFingerprint != null && message.hasOwnProperty("heartbeatRootFingerprint"))
                if (!$util.isString(message.heartbeatRootFingerprint))
                    return "heartbeatRootFingerprint: string expected";
            if (message.alg != null && message.hasOwnProperty("alg"))
                if (!$util.isString(message.alg))
                    return "alg: string expected";
            return null;
        };

        /**
         * Creates an Identity message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.Identity
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.Identity} Identity
         */
        Identity.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.Identity)
                return object;
            let message = new $root.lukuid.Identity();
            if (object.identityVersion != null)
                if ($util.Long)
                    (message.identityVersion = $util.Long.fromValue(object.identityVersion)).unsigned = true;
                else if (typeof object.identityVersion === "string")
                    message.identityVersion = parseInt(object.identityVersion, 10);
                else if (typeof object.identityVersion === "number")
                    message.identityVersion = object.identityVersion;
                else if (typeof object.identityVersion === "object")
                    message.identityVersion = new $util.LongBits(object.identityVersion.low >>> 0, object.identityVersion.high >>> 0).toNumber(true);
            if (object.dacSerial != null)
                message.dacSerial = String(object.dacSerial);
            if (object.slacSerial != null)
                message.slacSerial = String(object.slacSerial);
            if (object.lastSyncUtc != null)
                if ($util.Long)
                    (message.lastSyncUtc = $util.Long.fromValue(object.lastSyncUtc)).unsigned = false;
                else if (typeof object.lastSyncUtc === "string")
                    message.lastSyncUtc = parseInt(object.lastSyncUtc, 10);
                else if (typeof object.lastSyncUtc === "number")
                    message.lastSyncUtc = object.lastSyncUtc;
                else if (typeof object.lastSyncUtc === "object")
                    message.lastSyncUtc = new $util.LongBits(object.lastSyncUtc.low >>> 0, object.lastSyncUtc.high >>> 0).toNumber();
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.dacDer != null)
                if (typeof object.dacDer === "string")
                    $util.base64.decode(object.dacDer, message.dacDer = $util.newBuffer($util.base64.length(object.dacDer)), 0);
                else if (object.dacDer.length >= 0)
                    message.dacDer = object.dacDer;
            if (object.slacDer != null)
                if (typeof object.slacDer === "string")
                    $util.base64.decode(object.slacDer, message.slacDer = $util.newBuffer($util.base64.length(object.slacDer)), 0);
                else if (object.slacDer.length >= 0)
                    message.slacDer = object.slacDer;
            if (object.attestationManufacturerDer != null)
                if (typeof object.attestationManufacturerDer === "string")
                    $util.base64.decode(object.attestationManufacturerDer, message.attestationManufacturerDer = $util.newBuffer($util.base64.length(object.attestationManufacturerDer)), 0);
                else if (object.attestationManufacturerDer.length >= 0)
                    message.attestationManufacturerDer = object.attestationManufacturerDer;
            if (object.attestationIntermediateDer != null)
                if (typeof object.attestationIntermediateDer === "string")
                    $util.base64.decode(object.attestationIntermediateDer, message.attestationIntermediateDer = $util.newBuffer($util.base64.length(object.attestationIntermediateDer)), 0);
                else if (object.attestationIntermediateDer.length >= 0)
                    message.attestationIntermediateDer = object.attestationIntermediateDer;
            if (object.attestationRootFingerprint != null)
                message.attestationRootFingerprint = String(object.attestationRootFingerprint);
            if (object.heartbeatDer != null)
                if (typeof object.heartbeatDer === "string")
                    $util.base64.decode(object.heartbeatDer, message.heartbeatDer = $util.newBuffer($util.base64.length(object.heartbeatDer)), 0);
                else if (object.heartbeatDer.length >= 0)
                    message.heartbeatDer = object.heartbeatDer;
            if (object.heartbeatIntermediateDer != null)
                if (typeof object.heartbeatIntermediateDer === "string")
                    $util.base64.decode(object.heartbeatIntermediateDer, message.heartbeatIntermediateDer = $util.newBuffer($util.base64.length(object.heartbeatIntermediateDer)), 0);
                else if (object.heartbeatIntermediateDer.length >= 0)
                    message.heartbeatIntermediateDer = object.heartbeatIntermediateDer;
            if (object.heartbeatRootFingerprint != null)
                message.heartbeatRootFingerprint = String(object.heartbeatRootFingerprint);
            if (object.alg != null)
                message.alg = String(object.alg);
            return message;
        };

        /**
         * Creates a plain object from an Identity message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.Identity
         * @static
         * @param {lukuid.Identity} message Identity
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Identity.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.identityVersion = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.identityVersion = options.longs === String ? "0" : 0;
                object.dacSerial = "";
                object.slacSerial = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.lastSyncUtc = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.lastSyncUtc = options.longs === String ? "0" : 0;
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
                if (options.bytes === String)
                    object.dacDer = "";
                else {
                    object.dacDer = [];
                    if (options.bytes !== Array)
                        object.dacDer = $util.newBuffer(object.dacDer);
                }
                if (options.bytes === String)
                    object.slacDer = "";
                else {
                    object.slacDer = [];
                    if (options.bytes !== Array)
                        object.slacDer = $util.newBuffer(object.slacDer);
                }
                if (options.bytes === String)
                    object.attestationManufacturerDer = "";
                else {
                    object.attestationManufacturerDer = [];
                    if (options.bytes !== Array)
                        object.attestationManufacturerDer = $util.newBuffer(object.attestationManufacturerDer);
                }
                if (options.bytes === String)
                    object.attestationIntermediateDer = "";
                else {
                    object.attestationIntermediateDer = [];
                    if (options.bytes !== Array)
                        object.attestationIntermediateDer = $util.newBuffer(object.attestationIntermediateDer);
                }
                object.attestationRootFingerprint = "";
                if (options.bytes === String)
                    object.heartbeatDer = "";
                else {
                    object.heartbeatDer = [];
                    if (options.bytes !== Array)
                        object.heartbeatDer = $util.newBuffer(object.heartbeatDer);
                }
                if (options.bytes === String)
                    object.heartbeatIntermediateDer = "";
                else {
                    object.heartbeatIntermediateDer = [];
                    if (options.bytes !== Array)
                        object.heartbeatIntermediateDer = $util.newBuffer(object.heartbeatIntermediateDer);
                }
                object.heartbeatRootFingerprint = "";
                object.alg = "";
            }
            if (message.identityVersion != null && message.hasOwnProperty("identityVersion"))
                if (typeof message.identityVersion === "number")
                    object.identityVersion = options.longs === String ? String(message.identityVersion) : message.identityVersion;
                else
                    object.identityVersion = options.longs === String ? $util.Long.prototype.toString.call(message.identityVersion) : options.longs === Number ? new $util.LongBits(message.identityVersion.low >>> 0, message.identityVersion.high >>> 0).toNumber(true) : message.identityVersion;
            if (message.dacSerial != null && message.hasOwnProperty("dacSerial"))
                object.dacSerial = message.dacSerial;
            if (message.slacSerial != null && message.hasOwnProperty("slacSerial"))
                object.slacSerial = message.slacSerial;
            if (message.lastSyncUtc != null && message.hasOwnProperty("lastSyncUtc"))
                if (typeof message.lastSyncUtc === "number")
                    object.lastSyncUtc = options.longs === String ? String(message.lastSyncUtc) : message.lastSyncUtc;
                else
                    object.lastSyncUtc = options.longs === String ? $util.Long.prototype.toString.call(message.lastSyncUtc) : options.longs === Number ? new $util.LongBits(message.lastSyncUtc.low >>> 0, message.lastSyncUtc.high >>> 0).toNumber() : message.lastSyncUtc;
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            if (message.dacDer != null && message.hasOwnProperty("dacDer"))
                object.dacDer = options.bytes === String ? $util.base64.encode(message.dacDer, 0, message.dacDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.dacDer) : message.dacDer;
            if (message.slacDer != null && message.hasOwnProperty("slacDer"))
                object.slacDer = options.bytes === String ? $util.base64.encode(message.slacDer, 0, message.slacDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.slacDer) : message.slacDer;
            if (message.attestationManufacturerDer != null && message.hasOwnProperty("attestationManufacturerDer"))
                object.attestationManufacturerDer = options.bytes === String ? $util.base64.encode(message.attestationManufacturerDer, 0, message.attestationManufacturerDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.attestationManufacturerDer) : message.attestationManufacturerDer;
            if (message.attestationIntermediateDer != null && message.hasOwnProperty("attestationIntermediateDer"))
                object.attestationIntermediateDer = options.bytes === String ? $util.base64.encode(message.attestationIntermediateDer, 0, message.attestationIntermediateDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.attestationIntermediateDer) : message.attestationIntermediateDer;
            if (message.attestationRootFingerprint != null && message.hasOwnProperty("attestationRootFingerprint"))
                object.attestationRootFingerprint = message.attestationRootFingerprint;
            if (message.heartbeatDer != null && message.hasOwnProperty("heartbeatDer"))
                object.heartbeatDer = options.bytes === String ? $util.base64.encode(message.heartbeatDer, 0, message.heartbeatDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.heartbeatDer) : message.heartbeatDer;
            if (message.heartbeatIntermediateDer != null && message.hasOwnProperty("heartbeatIntermediateDer"))
                object.heartbeatIntermediateDer = options.bytes === String ? $util.base64.encode(message.heartbeatIntermediateDer, 0, message.heartbeatIntermediateDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.heartbeatIntermediateDer) : message.heartbeatIntermediateDer;
            if (message.heartbeatRootFingerprint != null && message.hasOwnProperty("heartbeatRootFingerprint"))
                object.heartbeatRootFingerprint = message.heartbeatRootFingerprint;
            if (message.alg != null && message.hasOwnProperty("alg"))
                object.alg = message.alg;
            return object;
        };

        /**
         * Converts this Identity to JSON.
         * @function toJSON
         * @memberof lukuid.Identity
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Identity.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Identity
         * @function getTypeUrl
         * @memberof lukuid.Identity
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Identity.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.Identity";
        };

        return Identity;
    })();

    lukuid.Attachment = (function() {

        /**
         * Properties of an Attachment.
         * @memberof lukuid
         * @interface IAttachment
         * @property {Uint8Array|null} [signature] Attachment signature
         * @property {string|null} [checksum] Attachment checksum
         * @property {number|Long|null} [timestampUtc] Attachment timestampUtc
         * @property {string|null} [mime] Attachment mime
         * @property {lukuid.IExternalIdentity|null} [externalIdentity] Attachment externalIdentity
         * @property {string|null} [type] Attachment type
         * @property {string|null} [title] Attachment title
         * @property {number|null} [lat] Attachment lat
         * @property {number|null} [lng] Attachment lng
         * @property {string|null} [content] Attachment content
         * @property {string|null} [merkleRoot] Attachment merkleRoot
         * @property {string|null} [alg] Attachment alg
         */

        /**
         * Constructs a new Attachment.
         * @memberof lukuid
         * @classdesc Represents an Attachment.
         * @implements IAttachment
         * @constructor
         * @param {lukuid.IAttachment=} [properties] Properties to set
         */
        function Attachment(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Attachment signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.signature = $util.newBuffer([]);

        /**
         * Attachment checksum.
         * @member {string} checksum
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.checksum = "";

        /**
         * Attachment timestampUtc.
         * @member {number|Long} timestampUtc
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.timestampUtc = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Attachment mime.
         * @member {string} mime
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.mime = "";

        /**
         * Attachment externalIdentity.
         * @member {lukuid.IExternalIdentity|null|undefined} externalIdentity
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.externalIdentity = null;

        /**
         * Attachment type.
         * @member {string} type
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.type = "";

        /**
         * Attachment title.
         * @member {string} title
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.title = "";

        /**
         * Attachment lat.
         * @member {number} lat
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.lat = 0;

        /**
         * Attachment lng.
         * @member {number} lng
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.lng = 0;

        /**
         * Attachment content.
         * @member {string} content
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.content = "";

        /**
         * Attachment merkleRoot.
         * @member {string} merkleRoot
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.merkleRoot = "";

        /**
         * Attachment alg.
         * @member {string} alg
         * @memberof lukuid.Attachment
         * @instance
         */
        Attachment.prototype.alg = "";

        /**
         * Creates a new Attachment instance using the specified properties.
         * @function create
         * @memberof lukuid.Attachment
         * @static
         * @param {lukuid.IAttachment=} [properties] Properties to set
         * @returns {lukuid.Attachment} Attachment instance
         */
        Attachment.create = function create(properties) {
            return new Attachment(properties);
        };

        /**
         * Encodes the specified Attachment message. Does not implicitly {@link lukuid.Attachment.verify|verify} messages.
         * @function encode
         * @memberof lukuid.Attachment
         * @static
         * @param {lukuid.IAttachment} message Attachment message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Attachment.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.signature);
            if (message.checksum != null && Object.hasOwnProperty.call(message, "checksum"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.checksum);
            if (message.timestampUtc != null && Object.hasOwnProperty.call(message, "timestampUtc"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.timestampUtc);
            if (message.mime != null && Object.hasOwnProperty.call(message, "mime"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.mime);
            if (message.externalIdentity != null && Object.hasOwnProperty.call(message, "externalIdentity"))
                $root.lukuid.ExternalIdentity.encode(message.externalIdentity, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.type);
            if (message.title != null && Object.hasOwnProperty.call(message, "title"))
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.title);
            if (message.lat != null && Object.hasOwnProperty.call(message, "lat"))
                writer.uint32(/* id 8, wireType 1 =*/65).double(message.lat);
            if (message.lng != null && Object.hasOwnProperty.call(message, "lng"))
                writer.uint32(/* id 9, wireType 1 =*/73).double(message.lng);
            if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                writer.uint32(/* id 11, wireType 2 =*/90).string(message.content);
            if (message.merkleRoot != null && Object.hasOwnProperty.call(message, "merkleRoot"))
                writer.uint32(/* id 12, wireType 2 =*/98).string(message.merkleRoot);
            if (message.alg != null && Object.hasOwnProperty.call(message, "alg"))
                writer.uint32(/* id 13, wireType 2 =*/106).string(message.alg);
            return writer;
        };

        /**
         * Encodes the specified Attachment message, length delimited. Does not implicitly {@link lukuid.Attachment.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.Attachment
         * @static
         * @param {lukuid.IAttachment} message Attachment message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Attachment.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Attachment message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.Attachment
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.Attachment} Attachment
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Attachment.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.Attachment();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 2: {
                        message.checksum = reader.string();
                        break;
                    }
                case 3: {
                        message.timestampUtc = reader.int64();
                        break;
                    }
                case 4: {
                        message.mime = reader.string();
                        break;
                    }
                case 5: {
                        message.externalIdentity = $root.lukuid.ExternalIdentity.decode(reader, reader.uint32());
                        break;
                    }
                case 6: {
                        message.type = reader.string();
                        break;
                    }
                case 7: {
                        message.title = reader.string();
                        break;
                    }
                case 8: {
                        message.lat = reader.double();
                        break;
                    }
                case 9: {
                        message.lng = reader.double();
                        break;
                    }
                case 11: {
                        message.content = reader.string();
                        break;
                    }
                case 12: {
                        message.merkleRoot = reader.string();
                        break;
                    }
                case 13: {
                        message.alg = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an Attachment message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.Attachment
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.Attachment} Attachment
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Attachment.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Attachment message.
         * @function verify
         * @memberof lukuid.Attachment
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Attachment.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            if (message.checksum != null && message.hasOwnProperty("checksum"))
                if (!$util.isString(message.checksum))
                    return "checksum: string expected";
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (!$util.isInteger(message.timestampUtc) && !(message.timestampUtc && $util.isInteger(message.timestampUtc.low) && $util.isInteger(message.timestampUtc.high)))
                    return "timestampUtc: integer|Long expected";
            if (message.mime != null && message.hasOwnProperty("mime"))
                if (!$util.isString(message.mime))
                    return "mime: string expected";
            if (message.externalIdentity != null && message.hasOwnProperty("externalIdentity")) {
                let error = $root.lukuid.ExternalIdentity.verify(message.externalIdentity);
                if (error)
                    return "externalIdentity." + error;
            }
            if (message.type != null && message.hasOwnProperty("type"))
                if (!$util.isString(message.type))
                    return "type: string expected";
            if (message.title != null && message.hasOwnProperty("title"))
                if (!$util.isString(message.title))
                    return "title: string expected";
            if (message.lat != null && message.hasOwnProperty("lat"))
                if (typeof message.lat !== "number")
                    return "lat: number expected";
            if (message.lng != null && message.hasOwnProperty("lng"))
                if (typeof message.lng !== "number")
                    return "lng: number expected";
            if (message.content != null && message.hasOwnProperty("content"))
                if (!$util.isString(message.content))
                    return "content: string expected";
            if (message.merkleRoot != null && message.hasOwnProperty("merkleRoot"))
                if (!$util.isString(message.merkleRoot))
                    return "merkleRoot: string expected";
            if (message.alg != null && message.hasOwnProperty("alg"))
                if (!$util.isString(message.alg))
                    return "alg: string expected";
            return null;
        };

        /**
         * Creates an Attachment message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.Attachment
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.Attachment} Attachment
         */
        Attachment.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.Attachment)
                return object;
            let message = new $root.lukuid.Attachment();
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.checksum != null)
                message.checksum = String(object.checksum);
            if (object.timestampUtc != null)
                if ($util.Long)
                    (message.timestampUtc = $util.Long.fromValue(object.timestampUtc)).unsigned = false;
                else if (typeof object.timestampUtc === "string")
                    message.timestampUtc = parseInt(object.timestampUtc, 10);
                else if (typeof object.timestampUtc === "number")
                    message.timestampUtc = object.timestampUtc;
                else if (typeof object.timestampUtc === "object")
                    message.timestampUtc = new $util.LongBits(object.timestampUtc.low >>> 0, object.timestampUtc.high >>> 0).toNumber();
            if (object.mime != null)
                message.mime = String(object.mime);
            if (object.externalIdentity != null) {
                if (typeof object.externalIdentity !== "object")
                    throw TypeError(".lukuid.Attachment.externalIdentity: object expected");
                message.externalIdentity = $root.lukuid.ExternalIdentity.fromObject(object.externalIdentity);
            }
            if (object.type != null)
                message.type = String(object.type);
            if (object.title != null)
                message.title = String(object.title);
            if (object.lat != null)
                message.lat = Number(object.lat);
            if (object.lng != null)
                message.lng = Number(object.lng);
            if (object.content != null)
                message.content = String(object.content);
            if (object.merkleRoot != null)
                message.merkleRoot = String(object.merkleRoot);
            if (object.alg != null)
                message.alg = String(object.alg);
            return message;
        };

        /**
         * Creates a plain object from an Attachment message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.Attachment
         * @static
         * @param {lukuid.Attachment} message Attachment
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Attachment.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
                object.checksum = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.timestampUtc = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.timestampUtc = options.longs === String ? "0" : 0;
                object.mime = "";
                object.externalIdentity = null;
                object.type = "";
                object.title = "";
                object.lat = 0;
                object.lng = 0;
                object.content = "";
                object.merkleRoot = "";
                object.alg = "";
            }
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            if (message.checksum != null && message.hasOwnProperty("checksum"))
                object.checksum = message.checksum;
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (typeof message.timestampUtc === "number")
                    object.timestampUtc = options.longs === String ? String(message.timestampUtc) : message.timestampUtc;
                else
                    object.timestampUtc = options.longs === String ? $util.Long.prototype.toString.call(message.timestampUtc) : options.longs === Number ? new $util.LongBits(message.timestampUtc.low >>> 0, message.timestampUtc.high >>> 0).toNumber() : message.timestampUtc;
            if (message.mime != null && message.hasOwnProperty("mime"))
                object.mime = message.mime;
            if (message.externalIdentity != null && message.hasOwnProperty("externalIdentity"))
                object.externalIdentity = $root.lukuid.ExternalIdentity.toObject(message.externalIdentity, options);
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = message.type;
            if (message.title != null && message.hasOwnProperty("title"))
                object.title = message.title;
            if (message.lat != null && message.hasOwnProperty("lat"))
                object.lat = options.json && !isFinite(message.lat) ? String(message.lat) : message.lat;
            if (message.lng != null && message.hasOwnProperty("lng"))
                object.lng = options.json && !isFinite(message.lng) ? String(message.lng) : message.lng;
            if (message.content != null && message.hasOwnProperty("content"))
                object.content = message.content;
            if (message.merkleRoot != null && message.hasOwnProperty("merkleRoot"))
                object.merkleRoot = message.merkleRoot;
            if (message.alg != null && message.hasOwnProperty("alg"))
                object.alg = message.alg;
            return object;
        };

        /**
         * Converts this Attachment to JSON.
         * @function toJSON
         * @memberof lukuid.Attachment
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Attachment.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Attachment
         * @function getTypeUrl
         * @memberof lukuid.Attachment
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Attachment.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.Attachment";
        };

        return Attachment;
    })();

    lukuid.ExternalIdentity = (function() {

        /**
         * Properties of an ExternalIdentity.
         * @memberof lukuid
         * @interface IExternalIdentity
         * @property {string|null} [endorserId] ExternalIdentity endorserId
         * @property {string|null} [rootFingerprint] ExternalIdentity rootFingerprint
         * @property {Array.<Uint8Array>|null} [certChainDer] ExternalIdentity certChainDer
         * @property {Uint8Array|null} [signature] ExternalIdentity signature
         */

        /**
         * Constructs a new ExternalIdentity.
         * @memberof lukuid
         * @classdesc Represents an ExternalIdentity.
         * @implements IExternalIdentity
         * @constructor
         * @param {lukuid.IExternalIdentity=} [properties] Properties to set
         */
        function ExternalIdentity(properties) {
            this.certChainDer = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ExternalIdentity endorserId.
         * @member {string} endorserId
         * @memberof lukuid.ExternalIdentity
         * @instance
         */
        ExternalIdentity.prototype.endorserId = "";

        /**
         * ExternalIdentity rootFingerprint.
         * @member {string} rootFingerprint
         * @memberof lukuid.ExternalIdentity
         * @instance
         */
        ExternalIdentity.prototype.rootFingerprint = "";

        /**
         * ExternalIdentity certChainDer.
         * @member {Array.<Uint8Array>} certChainDer
         * @memberof lukuid.ExternalIdentity
         * @instance
         */
        ExternalIdentity.prototype.certChainDer = $util.emptyArray;

        /**
         * ExternalIdentity signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.ExternalIdentity
         * @instance
         */
        ExternalIdentity.prototype.signature = $util.newBuffer([]);

        /**
         * Creates a new ExternalIdentity instance using the specified properties.
         * @function create
         * @memberof lukuid.ExternalIdentity
         * @static
         * @param {lukuid.IExternalIdentity=} [properties] Properties to set
         * @returns {lukuid.ExternalIdentity} ExternalIdentity instance
         */
        ExternalIdentity.create = function create(properties) {
            return new ExternalIdentity(properties);
        };

        /**
         * Encodes the specified ExternalIdentity message. Does not implicitly {@link lukuid.ExternalIdentity.verify|verify} messages.
         * @function encode
         * @memberof lukuid.ExternalIdentity
         * @static
         * @param {lukuid.IExternalIdentity} message ExternalIdentity message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ExternalIdentity.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.endorserId != null && Object.hasOwnProperty.call(message, "endorserId"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.endorserId);
            if (message.rootFingerprint != null && Object.hasOwnProperty.call(message, "rootFingerprint"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.rootFingerprint);
            if (message.certChainDer != null && message.certChainDer.length)
                for (let i = 0; i < message.certChainDer.length; ++i)
                    writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.certChainDer[i]);
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.signature);
            return writer;
        };

        /**
         * Encodes the specified ExternalIdentity message, length delimited. Does not implicitly {@link lukuid.ExternalIdentity.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.ExternalIdentity
         * @static
         * @param {lukuid.IExternalIdentity} message ExternalIdentity message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ExternalIdentity.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an ExternalIdentity message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.ExternalIdentity
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.ExternalIdentity} ExternalIdentity
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ExternalIdentity.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.ExternalIdentity();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.endorserId = reader.string();
                        break;
                    }
                case 2: {
                        message.rootFingerprint = reader.string();
                        break;
                    }
                case 3: {
                        if (!(message.certChainDer && message.certChainDer.length))
                            message.certChainDer = [];
                        message.certChainDer.push(reader.bytes());
                        break;
                    }
                case 4: {
                        message.signature = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an ExternalIdentity message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.ExternalIdentity
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.ExternalIdentity} ExternalIdentity
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ExternalIdentity.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an ExternalIdentity message.
         * @function verify
         * @memberof lukuid.ExternalIdentity
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ExternalIdentity.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.endorserId != null && message.hasOwnProperty("endorserId"))
                if (!$util.isString(message.endorserId))
                    return "endorserId: string expected";
            if (message.rootFingerprint != null && message.hasOwnProperty("rootFingerprint"))
                if (!$util.isString(message.rootFingerprint))
                    return "rootFingerprint: string expected";
            if (message.certChainDer != null && message.hasOwnProperty("certChainDer")) {
                if (!Array.isArray(message.certChainDer))
                    return "certChainDer: array expected";
                for (let i = 0; i < message.certChainDer.length; ++i)
                    if (!(message.certChainDer[i] && typeof message.certChainDer[i].length === "number" || $util.isString(message.certChainDer[i])))
                        return "certChainDer: buffer[] expected";
            }
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            return null;
        };

        /**
         * Creates an ExternalIdentity message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.ExternalIdentity
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.ExternalIdentity} ExternalIdentity
         */
        ExternalIdentity.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.ExternalIdentity)
                return object;
            let message = new $root.lukuid.ExternalIdentity();
            if (object.endorserId != null)
                message.endorserId = String(object.endorserId);
            if (object.rootFingerprint != null)
                message.rootFingerprint = String(object.rootFingerprint);
            if (object.certChainDer) {
                if (!Array.isArray(object.certChainDer))
                    throw TypeError(".lukuid.ExternalIdentity.certChainDer: array expected");
                message.certChainDer = [];
                for (let i = 0; i < object.certChainDer.length; ++i)
                    if (typeof object.certChainDer[i] === "string")
                        $util.base64.decode(object.certChainDer[i], message.certChainDer[i] = $util.newBuffer($util.base64.length(object.certChainDer[i])), 0);
                    else if (object.certChainDer[i].length >= 0)
                        message.certChainDer[i] = object.certChainDer[i];
            }
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            return message;
        };

        /**
         * Creates a plain object from an ExternalIdentity message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.ExternalIdentity
         * @static
         * @param {lukuid.ExternalIdentity} message ExternalIdentity
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ExternalIdentity.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.certChainDer = [];
            if (options.defaults) {
                object.endorserId = "";
                object.rootFingerprint = "";
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
            }
            if (message.endorserId != null && message.hasOwnProperty("endorserId"))
                object.endorserId = message.endorserId;
            if (message.rootFingerprint != null && message.hasOwnProperty("rootFingerprint"))
                object.rootFingerprint = message.rootFingerprint;
            if (message.certChainDer && message.certChainDer.length) {
                object.certChainDer = [];
                for (let j = 0; j < message.certChainDer.length; ++j)
                    object.certChainDer[j] = options.bytes === String ? $util.base64.encode(message.certChainDer[j], 0, message.certChainDer[j].length) : options.bytes === Array ? Array.prototype.slice.call(message.certChainDer[j]) : message.certChainDer[j];
            }
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            return object;
        };

        /**
         * Converts this ExternalIdentity to JSON.
         * @function toJSON
         * @memberof lukuid.ExternalIdentity
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ExternalIdentity.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ExternalIdentity
         * @function getTypeUrl
         * @memberof lukuid.ExternalIdentity
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ExternalIdentity.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.ExternalIdentity";
        };

        return ExternalIdentity;
    })();

    lukuid.AttachmentRecord = (function() {

        /**
         * Properties of an AttachmentRecord.
         * @memberof lukuid
         * @interface IAttachmentRecord
         * @property {string|null} [version] AttachmentRecord version
         * @property {string|null} [attachmentId] AttachmentRecord attachmentId
         * @property {string|null} [parentRecordId] AttachmentRecord parentRecordId
         * @property {Uint8Array|null} [signature] AttachmentRecord signature
         * @property {Uint8Array|null} [parentSignature] AttachmentRecord parentSignature
         * @property {string|null} [checksum] AttachmentRecord checksum
         * @property {number|Long|null} [timestampUtc] AttachmentRecord timestampUtc
         * @property {string|null} [mime] AttachmentRecord mime
         * @property {string|null} [type] AttachmentRecord type
         * @property {string|null} [title] AttachmentRecord title
         * @property {number|null} [lat] AttachmentRecord lat
         * @property {number|null} [lng] AttachmentRecord lng
         * @property {string|null} [content] AttachmentRecord content
         * @property {string|null} [merkleRoot] AttachmentRecord merkleRoot
         * @property {string|null} [alg] AttachmentRecord alg
         * @property {lukuid.IExternalIdentity|null} [externalIdentity] AttachmentRecord externalIdentity
         * @property {string|null} [custodyId] AttachmentRecord custodyId
         * @property {string|null} [event] AttachmentRecord event
         * @property {string|null} [canonicalString] AttachmentRecord canonicalString
         * @property {string|null} [status] AttachmentRecord status
         * @property {string|null} [contextRef] AttachmentRecord contextRef
         */

        /**
         * Constructs a new AttachmentRecord.
         * @memberof lukuid
         * @classdesc Represents an AttachmentRecord.
         * @implements IAttachmentRecord
         * @constructor
         * @param {lukuid.IAttachmentRecord=} [properties] Properties to set
         */
        function AttachmentRecord(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AttachmentRecord version.
         * @member {string} version
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.version = "";

        /**
         * AttachmentRecord attachmentId.
         * @member {string} attachmentId
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.attachmentId = "";

        /**
         * AttachmentRecord parentRecordId.
         * @member {string} parentRecordId
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.parentRecordId = "";

        /**
         * AttachmentRecord signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.signature = $util.newBuffer([]);

        /**
         * AttachmentRecord parentSignature.
         * @member {Uint8Array} parentSignature
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.parentSignature = $util.newBuffer([]);

        /**
         * AttachmentRecord checksum.
         * @member {string} checksum
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.checksum = "";

        /**
         * AttachmentRecord timestampUtc.
         * @member {number|Long} timestampUtc
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.timestampUtc = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * AttachmentRecord mime.
         * @member {string} mime
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.mime = "";

        /**
         * AttachmentRecord type.
         * @member {string} type
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.type = "";

        /**
         * AttachmentRecord title.
         * @member {string} title
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.title = "";

        /**
         * AttachmentRecord lat.
         * @member {number} lat
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.lat = 0;

        /**
         * AttachmentRecord lng.
         * @member {number} lng
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.lng = 0;

        /**
         * AttachmentRecord content.
         * @member {string} content
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.content = "";

        /**
         * AttachmentRecord merkleRoot.
         * @member {string} merkleRoot
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.merkleRoot = "";

        /**
         * AttachmentRecord alg.
         * @member {string} alg
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.alg = "";

        /**
         * AttachmentRecord externalIdentity.
         * @member {lukuid.IExternalIdentity|null|undefined} externalIdentity
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.externalIdentity = null;

        /**
         * AttachmentRecord custodyId.
         * @member {string} custodyId
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.custodyId = "";

        /**
         * AttachmentRecord event.
         * @member {string} event
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.event = "";

        /**
         * AttachmentRecord canonicalString.
         * @member {string} canonicalString
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.canonicalString = "";

        /**
         * AttachmentRecord status.
         * @member {string} status
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.status = "";

        /**
         * AttachmentRecord contextRef.
         * @member {string} contextRef
         * @memberof lukuid.AttachmentRecord
         * @instance
         */
        AttachmentRecord.prototype.contextRef = "";

        /**
         * Creates a new AttachmentRecord instance using the specified properties.
         * @function create
         * @memberof lukuid.AttachmentRecord
         * @static
         * @param {lukuid.IAttachmentRecord=} [properties] Properties to set
         * @returns {lukuid.AttachmentRecord} AttachmentRecord instance
         */
        AttachmentRecord.create = function create(properties) {
            return new AttachmentRecord(properties);
        };

        /**
         * Encodes the specified AttachmentRecord message. Does not implicitly {@link lukuid.AttachmentRecord.verify|verify} messages.
         * @function encode
         * @memberof lukuid.AttachmentRecord
         * @static
         * @param {lukuid.IAttachmentRecord} message AttachmentRecord message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AttachmentRecord.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.version != null && Object.hasOwnProperty.call(message, "version"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.version);
            if (message.attachmentId != null && Object.hasOwnProperty.call(message, "attachmentId"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.attachmentId);
            if (message.parentRecordId != null && Object.hasOwnProperty.call(message, "parentRecordId"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.parentRecordId);
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.signature);
            if (message.parentSignature != null && Object.hasOwnProperty.call(message, "parentSignature"))
                writer.uint32(/* id 5, wireType 2 =*/42).bytes(message.parentSignature);
            if (message.checksum != null && Object.hasOwnProperty.call(message, "checksum"))
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.checksum);
            if (message.timestampUtc != null && Object.hasOwnProperty.call(message, "timestampUtc"))
                writer.uint32(/* id 7, wireType 0 =*/56).int64(message.timestampUtc);
            if (message.mime != null && Object.hasOwnProperty.call(message, "mime"))
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.mime);
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.type);
            if (message.title != null && Object.hasOwnProperty.call(message, "title"))
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.title);
            if (message.lat != null && Object.hasOwnProperty.call(message, "lat"))
                writer.uint32(/* id 11, wireType 1 =*/89).double(message.lat);
            if (message.lng != null && Object.hasOwnProperty.call(message, "lng"))
                writer.uint32(/* id 12, wireType 1 =*/97).double(message.lng);
            if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                writer.uint32(/* id 14, wireType 2 =*/114).string(message.content);
            if (message.merkleRoot != null && Object.hasOwnProperty.call(message, "merkleRoot"))
                writer.uint32(/* id 15, wireType 2 =*/122).string(message.merkleRoot);
            if (message.alg != null && Object.hasOwnProperty.call(message, "alg"))
                writer.uint32(/* id 16, wireType 2 =*/130).string(message.alg);
            if (message.externalIdentity != null && Object.hasOwnProperty.call(message, "externalIdentity"))
                $root.lukuid.ExternalIdentity.encode(message.externalIdentity, writer.uint32(/* id 17, wireType 2 =*/138).fork()).ldelim();
            if (message.custodyId != null && Object.hasOwnProperty.call(message, "custodyId"))
                writer.uint32(/* id 18, wireType 2 =*/146).string(message.custodyId);
            if (message.event != null && Object.hasOwnProperty.call(message, "event"))
                writer.uint32(/* id 19, wireType 2 =*/154).string(message.event);
            if (message.canonicalString != null && Object.hasOwnProperty.call(message, "canonicalString"))
                writer.uint32(/* id 20, wireType 2 =*/162).string(message.canonicalString);
            if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                writer.uint32(/* id 21, wireType 2 =*/170).string(message.status);
            if (message.contextRef != null && Object.hasOwnProperty.call(message, "contextRef"))
                writer.uint32(/* id 22, wireType 2 =*/178).string(message.contextRef);
            return writer;
        };

        /**
         * Encodes the specified AttachmentRecord message, length delimited. Does not implicitly {@link lukuid.AttachmentRecord.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.AttachmentRecord
         * @static
         * @param {lukuid.IAttachmentRecord} message AttachmentRecord message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AttachmentRecord.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AttachmentRecord message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.AttachmentRecord
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.AttachmentRecord} AttachmentRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AttachmentRecord.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.AttachmentRecord();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.version = reader.string();
                        break;
                    }
                case 2: {
                        message.attachmentId = reader.string();
                        break;
                    }
                case 3: {
                        message.parentRecordId = reader.string();
                        break;
                    }
                case 4: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 5: {
                        message.parentSignature = reader.bytes();
                        break;
                    }
                case 6: {
                        message.checksum = reader.string();
                        break;
                    }
                case 7: {
                        message.timestampUtc = reader.int64();
                        break;
                    }
                case 8: {
                        message.mime = reader.string();
                        break;
                    }
                case 9: {
                        message.type = reader.string();
                        break;
                    }
                case 10: {
                        message.title = reader.string();
                        break;
                    }
                case 11: {
                        message.lat = reader.double();
                        break;
                    }
                case 12: {
                        message.lng = reader.double();
                        break;
                    }
                case 14: {
                        message.content = reader.string();
                        break;
                    }
                case 15: {
                        message.merkleRoot = reader.string();
                        break;
                    }
                case 16: {
                        message.alg = reader.string();
                        break;
                    }
                case 17: {
                        message.externalIdentity = $root.lukuid.ExternalIdentity.decode(reader, reader.uint32());
                        break;
                    }
                case 18: {
                        message.custodyId = reader.string();
                        break;
                    }
                case 19: {
                        message.event = reader.string();
                        break;
                    }
                case 20: {
                        message.canonicalString = reader.string();
                        break;
                    }
                case 21: {
                        message.status = reader.string();
                        break;
                    }
                case 22: {
                        message.contextRef = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AttachmentRecord message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.AttachmentRecord
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.AttachmentRecord} AttachmentRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AttachmentRecord.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AttachmentRecord message.
         * @function verify
         * @memberof lukuid.AttachmentRecord
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AttachmentRecord.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.version != null && message.hasOwnProperty("version"))
                if (!$util.isString(message.version))
                    return "version: string expected";
            if (message.attachmentId != null && message.hasOwnProperty("attachmentId"))
                if (!$util.isString(message.attachmentId))
                    return "attachmentId: string expected";
            if (message.parentRecordId != null && message.hasOwnProperty("parentRecordId"))
                if (!$util.isString(message.parentRecordId))
                    return "parentRecordId: string expected";
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            if (message.parentSignature != null && message.hasOwnProperty("parentSignature"))
                if (!(message.parentSignature && typeof message.parentSignature.length === "number" || $util.isString(message.parentSignature)))
                    return "parentSignature: buffer expected";
            if (message.checksum != null && message.hasOwnProperty("checksum"))
                if (!$util.isString(message.checksum))
                    return "checksum: string expected";
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (!$util.isInteger(message.timestampUtc) && !(message.timestampUtc && $util.isInteger(message.timestampUtc.low) && $util.isInteger(message.timestampUtc.high)))
                    return "timestampUtc: integer|Long expected";
            if (message.mime != null && message.hasOwnProperty("mime"))
                if (!$util.isString(message.mime))
                    return "mime: string expected";
            if (message.type != null && message.hasOwnProperty("type"))
                if (!$util.isString(message.type))
                    return "type: string expected";
            if (message.title != null && message.hasOwnProperty("title"))
                if (!$util.isString(message.title))
                    return "title: string expected";
            if (message.lat != null && message.hasOwnProperty("lat"))
                if (typeof message.lat !== "number")
                    return "lat: number expected";
            if (message.lng != null && message.hasOwnProperty("lng"))
                if (typeof message.lng !== "number")
                    return "lng: number expected";
            if (message.content != null && message.hasOwnProperty("content"))
                if (!$util.isString(message.content))
                    return "content: string expected";
            if (message.merkleRoot != null && message.hasOwnProperty("merkleRoot"))
                if (!$util.isString(message.merkleRoot))
                    return "merkleRoot: string expected";
            if (message.alg != null && message.hasOwnProperty("alg"))
                if (!$util.isString(message.alg))
                    return "alg: string expected";
            if (message.externalIdentity != null && message.hasOwnProperty("externalIdentity")) {
                let error = $root.lukuid.ExternalIdentity.verify(message.externalIdentity);
                if (error)
                    return "externalIdentity." + error;
            }
            if (message.custodyId != null && message.hasOwnProperty("custodyId"))
                if (!$util.isString(message.custodyId))
                    return "custodyId: string expected";
            if (message.event != null && message.hasOwnProperty("event"))
                if (!$util.isString(message.event))
                    return "event: string expected";
            if (message.canonicalString != null && message.hasOwnProperty("canonicalString"))
                if (!$util.isString(message.canonicalString))
                    return "canonicalString: string expected";
            if (message.status != null && message.hasOwnProperty("status"))
                if (!$util.isString(message.status))
                    return "status: string expected";
            if (message.contextRef != null && message.hasOwnProperty("contextRef"))
                if (!$util.isString(message.contextRef))
                    return "contextRef: string expected";
            return null;
        };

        /**
         * Creates an AttachmentRecord message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.AttachmentRecord
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.AttachmentRecord} AttachmentRecord
         */
        AttachmentRecord.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.AttachmentRecord)
                return object;
            let message = new $root.lukuid.AttachmentRecord();
            if (object.version != null)
                message.version = String(object.version);
            if (object.attachmentId != null)
                message.attachmentId = String(object.attachmentId);
            if (object.parentRecordId != null)
                message.parentRecordId = String(object.parentRecordId);
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.parentSignature != null)
                if (typeof object.parentSignature === "string")
                    $util.base64.decode(object.parentSignature, message.parentSignature = $util.newBuffer($util.base64.length(object.parentSignature)), 0);
                else if (object.parentSignature.length >= 0)
                    message.parentSignature = object.parentSignature;
            if (object.checksum != null)
                message.checksum = String(object.checksum);
            if (object.timestampUtc != null)
                if ($util.Long)
                    (message.timestampUtc = $util.Long.fromValue(object.timestampUtc)).unsigned = false;
                else if (typeof object.timestampUtc === "string")
                    message.timestampUtc = parseInt(object.timestampUtc, 10);
                else if (typeof object.timestampUtc === "number")
                    message.timestampUtc = object.timestampUtc;
                else if (typeof object.timestampUtc === "object")
                    message.timestampUtc = new $util.LongBits(object.timestampUtc.low >>> 0, object.timestampUtc.high >>> 0).toNumber();
            if (object.mime != null)
                message.mime = String(object.mime);
            if (object.type != null)
                message.type = String(object.type);
            if (object.title != null)
                message.title = String(object.title);
            if (object.lat != null)
                message.lat = Number(object.lat);
            if (object.lng != null)
                message.lng = Number(object.lng);
            if (object.content != null)
                message.content = String(object.content);
            if (object.merkleRoot != null)
                message.merkleRoot = String(object.merkleRoot);
            if (object.alg != null)
                message.alg = String(object.alg);
            if (object.externalIdentity != null) {
                if (typeof object.externalIdentity !== "object")
                    throw TypeError(".lukuid.AttachmentRecord.externalIdentity: object expected");
                message.externalIdentity = $root.lukuid.ExternalIdentity.fromObject(object.externalIdentity);
            }
            if (object.custodyId != null)
                message.custodyId = String(object.custodyId);
            if (object.event != null)
                message.event = String(object.event);
            if (object.canonicalString != null)
                message.canonicalString = String(object.canonicalString);
            if (object.status != null)
                message.status = String(object.status);
            if (object.contextRef != null)
                message.contextRef = String(object.contextRef);
            return message;
        };

        /**
         * Creates a plain object from an AttachmentRecord message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.AttachmentRecord
         * @static
         * @param {lukuid.AttachmentRecord} message AttachmentRecord
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AttachmentRecord.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.version = "";
                object.attachmentId = "";
                object.parentRecordId = "";
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
                if (options.bytes === String)
                    object.parentSignature = "";
                else {
                    object.parentSignature = [];
                    if (options.bytes !== Array)
                        object.parentSignature = $util.newBuffer(object.parentSignature);
                }
                object.checksum = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.timestampUtc = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.timestampUtc = options.longs === String ? "0" : 0;
                object.mime = "";
                object.type = "";
                object.title = "";
                object.lat = 0;
                object.lng = 0;
                object.content = "";
                object.merkleRoot = "";
                object.alg = "";
                object.externalIdentity = null;
                object.custodyId = "";
                object.event = "";
                object.canonicalString = "";
                object.status = "";
                object.contextRef = "";
            }
            if (message.version != null && message.hasOwnProperty("version"))
                object.version = message.version;
            if (message.attachmentId != null && message.hasOwnProperty("attachmentId"))
                object.attachmentId = message.attachmentId;
            if (message.parentRecordId != null && message.hasOwnProperty("parentRecordId"))
                object.parentRecordId = message.parentRecordId;
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            if (message.parentSignature != null && message.hasOwnProperty("parentSignature"))
                object.parentSignature = options.bytes === String ? $util.base64.encode(message.parentSignature, 0, message.parentSignature.length) : options.bytes === Array ? Array.prototype.slice.call(message.parentSignature) : message.parentSignature;
            if (message.checksum != null && message.hasOwnProperty("checksum"))
                object.checksum = message.checksum;
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (typeof message.timestampUtc === "number")
                    object.timestampUtc = options.longs === String ? String(message.timestampUtc) : message.timestampUtc;
                else
                    object.timestampUtc = options.longs === String ? $util.Long.prototype.toString.call(message.timestampUtc) : options.longs === Number ? new $util.LongBits(message.timestampUtc.low >>> 0, message.timestampUtc.high >>> 0).toNumber() : message.timestampUtc;
            if (message.mime != null && message.hasOwnProperty("mime"))
                object.mime = message.mime;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = message.type;
            if (message.title != null && message.hasOwnProperty("title"))
                object.title = message.title;
            if (message.lat != null && message.hasOwnProperty("lat"))
                object.lat = options.json && !isFinite(message.lat) ? String(message.lat) : message.lat;
            if (message.lng != null && message.hasOwnProperty("lng"))
                object.lng = options.json && !isFinite(message.lng) ? String(message.lng) : message.lng;
            if (message.content != null && message.hasOwnProperty("content"))
                object.content = message.content;
            if (message.merkleRoot != null && message.hasOwnProperty("merkleRoot"))
                object.merkleRoot = message.merkleRoot;
            if (message.alg != null && message.hasOwnProperty("alg"))
                object.alg = message.alg;
            if (message.externalIdentity != null && message.hasOwnProperty("externalIdentity"))
                object.externalIdentity = $root.lukuid.ExternalIdentity.toObject(message.externalIdentity, options);
            if (message.custodyId != null && message.hasOwnProperty("custodyId"))
                object.custodyId = message.custodyId;
            if (message.event != null && message.hasOwnProperty("event"))
                object.event = message.event;
            if (message.canonicalString != null && message.hasOwnProperty("canonicalString"))
                object.canonicalString = message.canonicalString;
            if (message.status != null && message.hasOwnProperty("status"))
                object.status = message.status;
            if (message.contextRef != null && message.hasOwnProperty("contextRef"))
                object.contextRef = message.contextRef;
            return object;
        };

        /**
         * Converts this AttachmentRecord to JSON.
         * @function toJSON
         * @memberof lukuid.AttachmentRecord
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AttachmentRecord.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for AttachmentRecord
         * @function getTypeUrl
         * @memberof lukuid.AttachmentRecord
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        AttachmentRecord.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.AttachmentRecord";
        };

        return AttachmentRecord;
    })();

    lukuid.ScanRecord = (function() {

        /**
         * Properties of a ScanRecord.
         * @memberof lukuid
         * @interface IScanRecord
         * @property {string|null} [version] ScanRecord version
         * @property {string|null} [scanId] ScanRecord scanId
         * @property {Uint8Array|null} [signature] ScanRecord signature
         * @property {Uint8Array|null} [previousSignature] ScanRecord previousSignature
         * @property {string|null} [canonicalString] ScanRecord canonicalString
         * @property {lukuid.IScanPayload|null} [payload] ScanRecord payload
         * @property {lukuid.IDeviceInfo|null} [device] ScanRecord device
         * @property {lukuid.IManufacturerInfo|null} [manufacturer] ScanRecord manufacturer
         * @property {Array.<lukuid.IAttachment>|null} [attachments] ScanRecord attachments
         * @property {lukuid.IIdentity|null} [identity] ScanRecord identity
         * @property {string|null} [alg] ScanRecord alg
         */

        /**
         * Constructs a new ScanRecord.
         * @memberof lukuid
         * @classdesc Represents a ScanRecord.
         * @implements IScanRecord
         * @constructor
         * @param {lukuid.IScanRecord=} [properties] Properties to set
         */
        function ScanRecord(properties) {
            this.attachments = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ScanRecord version.
         * @member {string} version
         * @memberof lukuid.ScanRecord
         * @instance
         */
        ScanRecord.prototype.version = "";

        /**
         * ScanRecord scanId.
         * @member {string} scanId
         * @memberof lukuid.ScanRecord
         * @instance
         */
        ScanRecord.prototype.scanId = "";

        /**
         * ScanRecord signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.ScanRecord
         * @instance
         */
        ScanRecord.prototype.signature = $util.newBuffer([]);

        /**
         * ScanRecord previousSignature.
         * @member {Uint8Array} previousSignature
         * @memberof lukuid.ScanRecord
         * @instance
         */
        ScanRecord.prototype.previousSignature = $util.newBuffer([]);

        /**
         * ScanRecord canonicalString.
         * @member {string} canonicalString
         * @memberof lukuid.ScanRecord
         * @instance
         */
        ScanRecord.prototype.canonicalString = "";

        /**
         * ScanRecord payload.
         * @member {lukuid.IScanPayload|null|undefined} payload
         * @memberof lukuid.ScanRecord
         * @instance
         */
        ScanRecord.prototype.payload = null;

        /**
         * ScanRecord device.
         * @member {lukuid.IDeviceInfo|null|undefined} device
         * @memberof lukuid.ScanRecord
         * @instance
         */
        ScanRecord.prototype.device = null;

        /**
         * ScanRecord manufacturer.
         * @member {lukuid.IManufacturerInfo|null|undefined} manufacturer
         * @memberof lukuid.ScanRecord
         * @instance
         */
        ScanRecord.prototype.manufacturer = null;

        /**
         * ScanRecord attachments.
         * @member {Array.<lukuid.IAttachment>} attachments
         * @memberof lukuid.ScanRecord
         * @instance
         */
        ScanRecord.prototype.attachments = $util.emptyArray;

        /**
         * ScanRecord identity.
         * @member {lukuid.IIdentity|null|undefined} identity
         * @memberof lukuid.ScanRecord
         * @instance
         */
        ScanRecord.prototype.identity = null;

        /**
         * ScanRecord alg.
         * @member {string} alg
         * @memberof lukuid.ScanRecord
         * @instance
         */
        ScanRecord.prototype.alg = "";

        /**
         * Creates a new ScanRecord instance using the specified properties.
         * @function create
         * @memberof lukuid.ScanRecord
         * @static
         * @param {lukuid.IScanRecord=} [properties] Properties to set
         * @returns {lukuid.ScanRecord} ScanRecord instance
         */
        ScanRecord.create = function create(properties) {
            return new ScanRecord(properties);
        };

        /**
         * Encodes the specified ScanRecord message. Does not implicitly {@link lukuid.ScanRecord.verify|verify} messages.
         * @function encode
         * @memberof lukuid.ScanRecord
         * @static
         * @param {lukuid.IScanRecord} message ScanRecord message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ScanRecord.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.version != null && Object.hasOwnProperty.call(message, "version"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.version);
            if (message.scanId != null && Object.hasOwnProperty.call(message, "scanId"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.scanId);
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.signature);
            if (message.previousSignature != null && Object.hasOwnProperty.call(message, "previousSignature"))
                writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.previousSignature);
            if (message.canonicalString != null && Object.hasOwnProperty.call(message, "canonicalString"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.canonicalString);
            if (message.payload != null && Object.hasOwnProperty.call(message, "payload"))
                $root.lukuid.ScanPayload.encode(message.payload, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.device != null && Object.hasOwnProperty.call(message, "device"))
                $root.lukuid.DeviceInfo.encode(message.device, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            if (message.manufacturer != null && Object.hasOwnProperty.call(message, "manufacturer"))
                $root.lukuid.ManufacturerInfo.encode(message.manufacturer, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
            if (message.attachments != null && message.attachments.length)
                for (let i = 0; i < message.attachments.length; ++i)
                    $root.lukuid.Attachment.encode(message.attachments[i], writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
            if (message.identity != null && Object.hasOwnProperty.call(message, "identity"))
                $root.lukuid.Identity.encode(message.identity, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
            if (message.alg != null && Object.hasOwnProperty.call(message, "alg"))
                writer.uint32(/* id 11, wireType 2 =*/90).string(message.alg);
            return writer;
        };

        /**
         * Encodes the specified ScanRecord message, length delimited. Does not implicitly {@link lukuid.ScanRecord.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.ScanRecord
         * @static
         * @param {lukuid.IScanRecord} message ScanRecord message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ScanRecord.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ScanRecord message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.ScanRecord
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.ScanRecord} ScanRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ScanRecord.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.ScanRecord();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.version = reader.string();
                        break;
                    }
                case 2: {
                        message.scanId = reader.string();
                        break;
                    }
                case 3: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 4: {
                        message.previousSignature = reader.bytes();
                        break;
                    }
                case 5: {
                        message.canonicalString = reader.string();
                        break;
                    }
                case 6: {
                        message.payload = $root.lukuid.ScanPayload.decode(reader, reader.uint32());
                        break;
                    }
                case 7: {
                        message.device = $root.lukuid.DeviceInfo.decode(reader, reader.uint32());
                        break;
                    }
                case 8: {
                        message.manufacturer = $root.lukuid.ManufacturerInfo.decode(reader, reader.uint32());
                        break;
                    }
                case 9: {
                        if (!(message.attachments && message.attachments.length))
                            message.attachments = [];
                        message.attachments.push($root.lukuid.Attachment.decode(reader, reader.uint32()));
                        break;
                    }
                case 10: {
                        message.identity = $root.lukuid.Identity.decode(reader, reader.uint32());
                        break;
                    }
                case 11: {
                        message.alg = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ScanRecord message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.ScanRecord
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.ScanRecord} ScanRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ScanRecord.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ScanRecord message.
         * @function verify
         * @memberof lukuid.ScanRecord
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ScanRecord.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.version != null && message.hasOwnProperty("version"))
                if (!$util.isString(message.version))
                    return "version: string expected";
            if (message.scanId != null && message.hasOwnProperty("scanId"))
                if (!$util.isString(message.scanId))
                    return "scanId: string expected";
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            if (message.previousSignature != null && message.hasOwnProperty("previousSignature"))
                if (!(message.previousSignature && typeof message.previousSignature.length === "number" || $util.isString(message.previousSignature)))
                    return "previousSignature: buffer expected";
            if (message.canonicalString != null && message.hasOwnProperty("canonicalString"))
                if (!$util.isString(message.canonicalString))
                    return "canonicalString: string expected";
            if (message.payload != null && message.hasOwnProperty("payload")) {
                let error = $root.lukuid.ScanPayload.verify(message.payload);
                if (error)
                    return "payload." + error;
            }
            if (message.device != null && message.hasOwnProperty("device")) {
                let error = $root.lukuid.DeviceInfo.verify(message.device);
                if (error)
                    return "device." + error;
            }
            if (message.manufacturer != null && message.hasOwnProperty("manufacturer")) {
                let error = $root.lukuid.ManufacturerInfo.verify(message.manufacturer);
                if (error)
                    return "manufacturer." + error;
            }
            if (message.attachments != null && message.hasOwnProperty("attachments")) {
                if (!Array.isArray(message.attachments))
                    return "attachments: array expected";
                for (let i = 0; i < message.attachments.length; ++i) {
                    let error = $root.lukuid.Attachment.verify(message.attachments[i]);
                    if (error)
                        return "attachments." + error;
                }
            }
            if (message.identity != null && message.hasOwnProperty("identity")) {
                let error = $root.lukuid.Identity.verify(message.identity);
                if (error)
                    return "identity." + error;
            }
            if (message.alg != null && message.hasOwnProperty("alg"))
                if (!$util.isString(message.alg))
                    return "alg: string expected";
            return null;
        };

        /**
         * Creates a ScanRecord message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.ScanRecord
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.ScanRecord} ScanRecord
         */
        ScanRecord.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.ScanRecord)
                return object;
            let message = new $root.lukuid.ScanRecord();
            if (object.version != null)
                message.version = String(object.version);
            if (object.scanId != null)
                message.scanId = String(object.scanId);
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.previousSignature != null)
                if (typeof object.previousSignature === "string")
                    $util.base64.decode(object.previousSignature, message.previousSignature = $util.newBuffer($util.base64.length(object.previousSignature)), 0);
                else if (object.previousSignature.length >= 0)
                    message.previousSignature = object.previousSignature;
            if (object.canonicalString != null)
                message.canonicalString = String(object.canonicalString);
            if (object.payload != null) {
                if (typeof object.payload !== "object")
                    throw TypeError(".lukuid.ScanRecord.payload: object expected");
                message.payload = $root.lukuid.ScanPayload.fromObject(object.payload);
            }
            if (object.device != null) {
                if (typeof object.device !== "object")
                    throw TypeError(".lukuid.ScanRecord.device: object expected");
                message.device = $root.lukuid.DeviceInfo.fromObject(object.device);
            }
            if (object.manufacturer != null) {
                if (typeof object.manufacturer !== "object")
                    throw TypeError(".lukuid.ScanRecord.manufacturer: object expected");
                message.manufacturer = $root.lukuid.ManufacturerInfo.fromObject(object.manufacturer);
            }
            if (object.attachments) {
                if (!Array.isArray(object.attachments))
                    throw TypeError(".lukuid.ScanRecord.attachments: array expected");
                message.attachments = [];
                for (let i = 0; i < object.attachments.length; ++i) {
                    if (typeof object.attachments[i] !== "object")
                        throw TypeError(".lukuid.ScanRecord.attachments: object expected");
                    message.attachments[i] = $root.lukuid.Attachment.fromObject(object.attachments[i]);
                }
            }
            if (object.identity != null) {
                if (typeof object.identity !== "object")
                    throw TypeError(".lukuid.ScanRecord.identity: object expected");
                message.identity = $root.lukuid.Identity.fromObject(object.identity);
            }
            if (object.alg != null)
                message.alg = String(object.alg);
            return message;
        };

        /**
         * Creates a plain object from a ScanRecord message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.ScanRecord
         * @static
         * @param {lukuid.ScanRecord} message ScanRecord
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ScanRecord.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.attachments = [];
            if (options.defaults) {
                object.version = "";
                object.scanId = "";
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
                if (options.bytes === String)
                    object.previousSignature = "";
                else {
                    object.previousSignature = [];
                    if (options.bytes !== Array)
                        object.previousSignature = $util.newBuffer(object.previousSignature);
                }
                object.canonicalString = "";
                object.payload = null;
                object.device = null;
                object.manufacturer = null;
                object.identity = null;
                object.alg = "";
            }
            if (message.version != null && message.hasOwnProperty("version"))
                object.version = message.version;
            if (message.scanId != null && message.hasOwnProperty("scanId"))
                object.scanId = message.scanId;
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            if (message.previousSignature != null && message.hasOwnProperty("previousSignature"))
                object.previousSignature = options.bytes === String ? $util.base64.encode(message.previousSignature, 0, message.previousSignature.length) : options.bytes === Array ? Array.prototype.slice.call(message.previousSignature) : message.previousSignature;
            if (message.canonicalString != null && message.hasOwnProperty("canonicalString"))
                object.canonicalString = message.canonicalString;
            if (message.payload != null && message.hasOwnProperty("payload"))
                object.payload = $root.lukuid.ScanPayload.toObject(message.payload, options);
            if (message.device != null && message.hasOwnProperty("device"))
                object.device = $root.lukuid.DeviceInfo.toObject(message.device, options);
            if (message.manufacturer != null && message.hasOwnProperty("manufacturer"))
                object.manufacturer = $root.lukuid.ManufacturerInfo.toObject(message.manufacturer, options);
            if (message.attachments && message.attachments.length) {
                object.attachments = [];
                for (let j = 0; j < message.attachments.length; ++j)
                    object.attachments[j] = $root.lukuid.Attachment.toObject(message.attachments[j], options);
            }
            if (message.identity != null && message.hasOwnProperty("identity"))
                object.identity = $root.lukuid.Identity.toObject(message.identity, options);
            if (message.alg != null && message.hasOwnProperty("alg"))
                object.alg = message.alg;
            return object;
        };

        /**
         * Converts this ScanRecord to JSON.
         * @function toJSON
         * @memberof lukuid.ScanRecord
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ScanRecord.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ScanRecord
         * @function getTypeUrl
         * @memberof lukuid.ScanRecord
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ScanRecord.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.ScanRecord";
        };

        return ScanRecord;
    })();

    lukuid.EnvironmentPayload = (function() {

        /**
         * Properties of an EnvironmentPayload.
         * @memberof lukuid
         * @interface IEnvironmentPayload
         * @property {number|Long|null} [ctr] EnvironmentPayload ctr
         * @property {number|Long|null} [timestampUtc] EnvironmentPayload timestampUtc
         * @property {number|Long|null} [uptimeUs] EnvironmentPayload uptimeUs
         * @property {string|null} [nonce] EnvironmentPayload nonce
         * @property {string|null} [firmware] EnvironmentPayload firmware
         * @property {number|null} [lux] EnvironmentPayload lux
         * @property {number|null} [tempC] EnvironmentPayload tempC
         * @property {number|null} [humidityPct] EnvironmentPayload humidityPct
         * @property {number|null} [pressureHpa] EnvironmentPayload pressureHpa
         * @property {number|null} [vocIndex] EnvironmentPayload vocIndex
         * @property {lukuid.EnvironmentPayload.IAccel|null} [accelG] EnvironmentPayload accelG
         * @property {boolean|null} [tamper] EnvironmentPayload tamper
         * @property {boolean|null} [wakeEvent] EnvironmentPayload wakeEvent
         * @property {boolean|null} [vbusPresent] EnvironmentPayload vbusPresent
         * @property {string|null} [genesisHash] EnvironmentPayload genesisHash
         */

        /**
         * Constructs a new EnvironmentPayload.
         * @memberof lukuid
         * @classdesc Represents an EnvironmentPayload.
         * @implements IEnvironmentPayload
         * @constructor
         * @param {lukuid.IEnvironmentPayload=} [properties] Properties to set
         */
        function EnvironmentPayload(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * EnvironmentPayload ctr.
         * @member {number|Long} ctr
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.ctr = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * EnvironmentPayload timestampUtc.
         * @member {number|Long} timestampUtc
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.timestampUtc = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * EnvironmentPayload uptimeUs.
         * @member {number|Long} uptimeUs
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.uptimeUs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * EnvironmentPayload nonce.
         * @member {string} nonce
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.nonce = "";

        /**
         * EnvironmentPayload firmware.
         * @member {string} firmware
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.firmware = "";

        /**
         * EnvironmentPayload lux.
         * @member {number} lux
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.lux = 0;

        /**
         * EnvironmentPayload tempC.
         * @member {number} tempC
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.tempC = 0;

        /**
         * EnvironmentPayload humidityPct.
         * @member {number} humidityPct
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.humidityPct = 0;

        /**
         * EnvironmentPayload pressureHpa.
         * @member {number} pressureHpa
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.pressureHpa = 0;

        /**
         * EnvironmentPayload vocIndex.
         * @member {number} vocIndex
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.vocIndex = 0;

        /**
         * EnvironmentPayload accelG.
         * @member {lukuid.EnvironmentPayload.IAccel|null|undefined} accelG
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.accelG = null;

        /**
         * EnvironmentPayload tamper.
         * @member {boolean} tamper
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.tamper = false;

        /**
         * EnvironmentPayload wakeEvent.
         * @member {boolean} wakeEvent
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.wakeEvent = false;

        /**
         * EnvironmentPayload vbusPresent.
         * @member {boolean} vbusPresent
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.vbusPresent = false;

        /**
         * EnvironmentPayload genesisHash.
         * @member {string} genesisHash
         * @memberof lukuid.EnvironmentPayload
         * @instance
         */
        EnvironmentPayload.prototype.genesisHash = "";

        /**
         * Creates a new EnvironmentPayload instance using the specified properties.
         * @function create
         * @memberof lukuid.EnvironmentPayload
         * @static
         * @param {lukuid.IEnvironmentPayload=} [properties] Properties to set
         * @returns {lukuid.EnvironmentPayload} EnvironmentPayload instance
         */
        EnvironmentPayload.create = function create(properties) {
            return new EnvironmentPayload(properties);
        };

        /**
         * Encodes the specified EnvironmentPayload message. Does not implicitly {@link lukuid.EnvironmentPayload.verify|verify} messages.
         * @function encode
         * @memberof lukuid.EnvironmentPayload
         * @static
         * @param {lukuid.IEnvironmentPayload} message EnvironmentPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EnvironmentPayload.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.ctr != null && Object.hasOwnProperty.call(message, "ctr"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.ctr);
            if (message.timestampUtc != null && Object.hasOwnProperty.call(message, "timestampUtc"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.timestampUtc);
            if (message.uptimeUs != null && Object.hasOwnProperty.call(message, "uptimeUs"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.uptimeUs);
            if (message.nonce != null && Object.hasOwnProperty.call(message, "nonce"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.nonce);
            if (message.firmware != null && Object.hasOwnProperty.call(message, "firmware"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.firmware);
            if (message.lux != null && Object.hasOwnProperty.call(message, "lux"))
                writer.uint32(/* id 6, wireType 5 =*/53).float(message.lux);
            if (message.tempC != null && Object.hasOwnProperty.call(message, "tempC"))
                writer.uint32(/* id 7, wireType 5 =*/61).float(message.tempC);
            if (message.humidityPct != null && Object.hasOwnProperty.call(message, "humidityPct"))
                writer.uint32(/* id 8, wireType 5 =*/69).float(message.humidityPct);
            if (message.pressureHpa != null && Object.hasOwnProperty.call(message, "pressureHpa"))
                writer.uint32(/* id 9, wireType 5 =*/77).float(message.pressureHpa);
            if (message.vocIndex != null && Object.hasOwnProperty.call(message, "vocIndex"))
                writer.uint32(/* id 10, wireType 0 =*/80).uint32(message.vocIndex);
            if (message.accelG != null && Object.hasOwnProperty.call(message, "accelG"))
                $root.lukuid.EnvironmentPayload.Accel.encode(message.accelG, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
            if (message.tamper != null && Object.hasOwnProperty.call(message, "tamper"))
                writer.uint32(/* id 12, wireType 0 =*/96).bool(message.tamper);
            if (message.wakeEvent != null && Object.hasOwnProperty.call(message, "wakeEvent"))
                writer.uint32(/* id 13, wireType 0 =*/104).bool(message.wakeEvent);
            if (message.vbusPresent != null && Object.hasOwnProperty.call(message, "vbusPresent"))
                writer.uint32(/* id 14, wireType 0 =*/112).bool(message.vbusPresent);
            if (message.genesisHash != null && Object.hasOwnProperty.call(message, "genesisHash"))
                writer.uint32(/* id 15, wireType 2 =*/122).string(message.genesisHash);
            return writer;
        };

        /**
         * Encodes the specified EnvironmentPayload message, length delimited. Does not implicitly {@link lukuid.EnvironmentPayload.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.EnvironmentPayload
         * @static
         * @param {lukuid.IEnvironmentPayload} message EnvironmentPayload message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EnvironmentPayload.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an EnvironmentPayload message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.EnvironmentPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.EnvironmentPayload} EnvironmentPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EnvironmentPayload.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.EnvironmentPayload();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ctr = reader.uint64();
                        break;
                    }
                case 2: {
                        message.timestampUtc = reader.int64();
                        break;
                    }
                case 3: {
                        message.uptimeUs = reader.int64();
                        break;
                    }
                case 4: {
                        message.nonce = reader.string();
                        break;
                    }
                case 5: {
                        message.firmware = reader.string();
                        break;
                    }
                case 6: {
                        message.lux = reader.float();
                        break;
                    }
                case 7: {
                        message.tempC = reader.float();
                        break;
                    }
                case 8: {
                        message.humidityPct = reader.float();
                        break;
                    }
                case 9: {
                        message.pressureHpa = reader.float();
                        break;
                    }
                case 10: {
                        message.vocIndex = reader.uint32();
                        break;
                    }
                case 11: {
                        message.accelG = $root.lukuid.EnvironmentPayload.Accel.decode(reader, reader.uint32());
                        break;
                    }
                case 12: {
                        message.tamper = reader.bool();
                        break;
                    }
                case 13: {
                        message.wakeEvent = reader.bool();
                        break;
                    }
                case 14: {
                        message.vbusPresent = reader.bool();
                        break;
                    }
                case 15: {
                        message.genesisHash = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an EnvironmentPayload message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.EnvironmentPayload
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.EnvironmentPayload} EnvironmentPayload
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EnvironmentPayload.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EnvironmentPayload message.
         * @function verify
         * @memberof lukuid.EnvironmentPayload
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EnvironmentPayload.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.ctr != null && message.hasOwnProperty("ctr"))
                if (!$util.isInteger(message.ctr) && !(message.ctr && $util.isInteger(message.ctr.low) && $util.isInteger(message.ctr.high)))
                    return "ctr: integer|Long expected";
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (!$util.isInteger(message.timestampUtc) && !(message.timestampUtc && $util.isInteger(message.timestampUtc.low) && $util.isInteger(message.timestampUtc.high)))
                    return "timestampUtc: integer|Long expected";
            if (message.uptimeUs != null && message.hasOwnProperty("uptimeUs"))
                if (!$util.isInteger(message.uptimeUs) && !(message.uptimeUs && $util.isInteger(message.uptimeUs.low) && $util.isInteger(message.uptimeUs.high)))
                    return "uptimeUs: integer|Long expected";
            if (message.nonce != null && message.hasOwnProperty("nonce"))
                if (!$util.isString(message.nonce))
                    return "nonce: string expected";
            if (message.firmware != null && message.hasOwnProperty("firmware"))
                if (!$util.isString(message.firmware))
                    return "firmware: string expected";
            if (message.lux != null && message.hasOwnProperty("lux"))
                if (typeof message.lux !== "number")
                    return "lux: number expected";
            if (message.tempC != null && message.hasOwnProperty("tempC"))
                if (typeof message.tempC !== "number")
                    return "tempC: number expected";
            if (message.humidityPct != null && message.hasOwnProperty("humidityPct"))
                if (typeof message.humidityPct !== "number")
                    return "humidityPct: number expected";
            if (message.pressureHpa != null && message.hasOwnProperty("pressureHpa"))
                if (typeof message.pressureHpa !== "number")
                    return "pressureHpa: number expected";
            if (message.vocIndex != null && message.hasOwnProperty("vocIndex"))
                if (!$util.isInteger(message.vocIndex))
                    return "vocIndex: integer expected";
            if (message.accelG != null && message.hasOwnProperty("accelG")) {
                let error = $root.lukuid.EnvironmentPayload.Accel.verify(message.accelG);
                if (error)
                    return "accelG." + error;
            }
            if (message.tamper != null && message.hasOwnProperty("tamper"))
                if (typeof message.tamper !== "boolean")
                    return "tamper: boolean expected";
            if (message.wakeEvent != null && message.hasOwnProperty("wakeEvent"))
                if (typeof message.wakeEvent !== "boolean")
                    return "wakeEvent: boolean expected";
            if (message.vbusPresent != null && message.hasOwnProperty("vbusPresent"))
                if (typeof message.vbusPresent !== "boolean")
                    return "vbusPresent: boolean expected";
            if (message.genesisHash != null && message.hasOwnProperty("genesisHash"))
                if (!$util.isString(message.genesisHash))
                    return "genesisHash: string expected";
            return null;
        };

        /**
         * Creates an EnvironmentPayload message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.EnvironmentPayload
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.EnvironmentPayload} EnvironmentPayload
         */
        EnvironmentPayload.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.EnvironmentPayload)
                return object;
            let message = new $root.lukuid.EnvironmentPayload();
            if (object.ctr != null)
                if ($util.Long)
                    (message.ctr = $util.Long.fromValue(object.ctr)).unsigned = true;
                else if (typeof object.ctr === "string")
                    message.ctr = parseInt(object.ctr, 10);
                else if (typeof object.ctr === "number")
                    message.ctr = object.ctr;
                else if (typeof object.ctr === "object")
                    message.ctr = new $util.LongBits(object.ctr.low >>> 0, object.ctr.high >>> 0).toNumber(true);
            if (object.timestampUtc != null)
                if ($util.Long)
                    (message.timestampUtc = $util.Long.fromValue(object.timestampUtc)).unsigned = false;
                else if (typeof object.timestampUtc === "string")
                    message.timestampUtc = parseInt(object.timestampUtc, 10);
                else if (typeof object.timestampUtc === "number")
                    message.timestampUtc = object.timestampUtc;
                else if (typeof object.timestampUtc === "object")
                    message.timestampUtc = new $util.LongBits(object.timestampUtc.low >>> 0, object.timestampUtc.high >>> 0).toNumber();
            if (object.uptimeUs != null)
                if ($util.Long)
                    (message.uptimeUs = $util.Long.fromValue(object.uptimeUs)).unsigned = false;
                else if (typeof object.uptimeUs === "string")
                    message.uptimeUs = parseInt(object.uptimeUs, 10);
                else if (typeof object.uptimeUs === "number")
                    message.uptimeUs = object.uptimeUs;
                else if (typeof object.uptimeUs === "object")
                    message.uptimeUs = new $util.LongBits(object.uptimeUs.low >>> 0, object.uptimeUs.high >>> 0).toNumber();
            if (object.nonce != null)
                message.nonce = String(object.nonce);
            if (object.firmware != null)
                message.firmware = String(object.firmware);
            if (object.lux != null)
                message.lux = Number(object.lux);
            if (object.tempC != null)
                message.tempC = Number(object.tempC);
            if (object.humidityPct != null)
                message.humidityPct = Number(object.humidityPct);
            if (object.pressureHpa != null)
                message.pressureHpa = Number(object.pressureHpa);
            if (object.vocIndex != null)
                message.vocIndex = object.vocIndex >>> 0;
            if (object.accelG != null) {
                if (typeof object.accelG !== "object")
                    throw TypeError(".lukuid.EnvironmentPayload.accelG: object expected");
                message.accelG = $root.lukuid.EnvironmentPayload.Accel.fromObject(object.accelG);
            }
            if (object.tamper != null)
                message.tamper = Boolean(object.tamper);
            if (object.wakeEvent != null)
                message.wakeEvent = Boolean(object.wakeEvent);
            if (object.vbusPresent != null)
                message.vbusPresent = Boolean(object.vbusPresent);
            if (object.genesisHash != null)
                message.genesisHash = String(object.genesisHash);
            return message;
        };

        /**
         * Creates a plain object from an EnvironmentPayload message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.EnvironmentPayload
         * @static
         * @param {lukuid.EnvironmentPayload} message EnvironmentPayload
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EnvironmentPayload.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.ctr = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.ctr = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.timestampUtc = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.timestampUtc = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.uptimeUs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.uptimeUs = options.longs === String ? "0" : 0;
                object.nonce = "";
                object.firmware = "";
                object.lux = 0;
                object.tempC = 0;
                object.humidityPct = 0;
                object.pressureHpa = 0;
                object.vocIndex = 0;
                object.accelG = null;
                object.tamper = false;
                object.wakeEvent = false;
                object.vbusPresent = false;
                object.genesisHash = "";
            }
            if (message.ctr != null && message.hasOwnProperty("ctr"))
                if (typeof message.ctr === "number")
                    object.ctr = options.longs === String ? String(message.ctr) : message.ctr;
                else
                    object.ctr = options.longs === String ? $util.Long.prototype.toString.call(message.ctr) : options.longs === Number ? new $util.LongBits(message.ctr.low >>> 0, message.ctr.high >>> 0).toNumber(true) : message.ctr;
            if (message.timestampUtc != null && message.hasOwnProperty("timestampUtc"))
                if (typeof message.timestampUtc === "number")
                    object.timestampUtc = options.longs === String ? String(message.timestampUtc) : message.timestampUtc;
                else
                    object.timestampUtc = options.longs === String ? $util.Long.prototype.toString.call(message.timestampUtc) : options.longs === Number ? new $util.LongBits(message.timestampUtc.low >>> 0, message.timestampUtc.high >>> 0).toNumber() : message.timestampUtc;
            if (message.uptimeUs != null && message.hasOwnProperty("uptimeUs"))
                if (typeof message.uptimeUs === "number")
                    object.uptimeUs = options.longs === String ? String(message.uptimeUs) : message.uptimeUs;
                else
                    object.uptimeUs = options.longs === String ? $util.Long.prototype.toString.call(message.uptimeUs) : options.longs === Number ? new $util.LongBits(message.uptimeUs.low >>> 0, message.uptimeUs.high >>> 0).toNumber() : message.uptimeUs;
            if (message.nonce != null && message.hasOwnProperty("nonce"))
                object.nonce = message.nonce;
            if (message.firmware != null && message.hasOwnProperty("firmware"))
                object.firmware = message.firmware;
            if (message.lux != null && message.hasOwnProperty("lux"))
                object.lux = options.json && !isFinite(message.lux) ? String(message.lux) : message.lux;
            if (message.tempC != null && message.hasOwnProperty("tempC"))
                object.tempC = options.json && !isFinite(message.tempC) ? String(message.tempC) : message.tempC;
            if (message.humidityPct != null && message.hasOwnProperty("humidityPct"))
                object.humidityPct = options.json && !isFinite(message.humidityPct) ? String(message.humidityPct) : message.humidityPct;
            if (message.pressureHpa != null && message.hasOwnProperty("pressureHpa"))
                object.pressureHpa = options.json && !isFinite(message.pressureHpa) ? String(message.pressureHpa) : message.pressureHpa;
            if (message.vocIndex != null && message.hasOwnProperty("vocIndex"))
                object.vocIndex = message.vocIndex;
            if (message.accelG != null && message.hasOwnProperty("accelG"))
                object.accelG = $root.lukuid.EnvironmentPayload.Accel.toObject(message.accelG, options);
            if (message.tamper != null && message.hasOwnProperty("tamper"))
                object.tamper = message.tamper;
            if (message.wakeEvent != null && message.hasOwnProperty("wakeEvent"))
                object.wakeEvent = message.wakeEvent;
            if (message.vbusPresent != null && message.hasOwnProperty("vbusPresent"))
                object.vbusPresent = message.vbusPresent;
            if (message.genesisHash != null && message.hasOwnProperty("genesisHash"))
                object.genesisHash = message.genesisHash;
            return object;
        };

        /**
         * Converts this EnvironmentPayload to JSON.
         * @function toJSON
         * @memberof lukuid.EnvironmentPayload
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EnvironmentPayload.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for EnvironmentPayload
         * @function getTypeUrl
         * @memberof lukuid.EnvironmentPayload
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        EnvironmentPayload.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.EnvironmentPayload";
        };

        EnvironmentPayload.Accel = (function() {

            /**
             * Properties of an Accel.
             * @memberof lukuid.EnvironmentPayload
             * @interface IAccel
             * @property {number|null} [x] Accel x
             * @property {number|null} [y] Accel y
             * @property {number|null} [z] Accel z
             */

            /**
             * Constructs a new Accel.
             * @memberof lukuid.EnvironmentPayload
             * @classdesc Represents an Accel.
             * @implements IAccel
             * @constructor
             * @param {lukuid.EnvironmentPayload.IAccel=} [properties] Properties to set
             */
            function Accel(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Accel x.
             * @member {number} x
             * @memberof lukuid.EnvironmentPayload.Accel
             * @instance
             */
            Accel.prototype.x = 0;

            /**
             * Accel y.
             * @member {number} y
             * @memberof lukuid.EnvironmentPayload.Accel
             * @instance
             */
            Accel.prototype.y = 0;

            /**
             * Accel z.
             * @member {number} z
             * @memberof lukuid.EnvironmentPayload.Accel
             * @instance
             */
            Accel.prototype.z = 0;

            /**
             * Creates a new Accel instance using the specified properties.
             * @function create
             * @memberof lukuid.EnvironmentPayload.Accel
             * @static
             * @param {lukuid.EnvironmentPayload.IAccel=} [properties] Properties to set
             * @returns {lukuid.EnvironmentPayload.Accel} Accel instance
             */
            Accel.create = function create(properties) {
                return new Accel(properties);
            };

            /**
             * Encodes the specified Accel message. Does not implicitly {@link lukuid.EnvironmentPayload.Accel.verify|verify} messages.
             * @function encode
             * @memberof lukuid.EnvironmentPayload.Accel
             * @static
             * @param {lukuid.EnvironmentPayload.IAccel} message Accel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Accel.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.x != null && Object.hasOwnProperty.call(message, "x"))
                    writer.uint32(/* id 1, wireType 5 =*/13).float(message.x);
                if (message.y != null && Object.hasOwnProperty.call(message, "y"))
                    writer.uint32(/* id 2, wireType 5 =*/21).float(message.y);
                if (message.z != null && Object.hasOwnProperty.call(message, "z"))
                    writer.uint32(/* id 3, wireType 5 =*/29).float(message.z);
                return writer;
            };

            /**
             * Encodes the specified Accel message, length delimited. Does not implicitly {@link lukuid.EnvironmentPayload.Accel.verify|verify} messages.
             * @function encodeDelimited
             * @memberof lukuid.EnvironmentPayload.Accel
             * @static
             * @param {lukuid.EnvironmentPayload.IAccel} message Accel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Accel.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Accel message from the specified reader or buffer.
             * @function decode
             * @memberof lukuid.EnvironmentPayload.Accel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {lukuid.EnvironmentPayload.Accel} Accel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Accel.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.EnvironmentPayload.Accel();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.x = reader.float();
                            break;
                        }
                    case 2: {
                            message.y = reader.float();
                            break;
                        }
                    case 3: {
                            message.z = reader.float();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an Accel message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof lukuid.EnvironmentPayload.Accel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {lukuid.EnvironmentPayload.Accel} Accel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Accel.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Accel message.
             * @function verify
             * @memberof lukuid.EnvironmentPayload.Accel
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Accel.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.x != null && message.hasOwnProperty("x"))
                    if (typeof message.x !== "number")
                        return "x: number expected";
                if (message.y != null && message.hasOwnProperty("y"))
                    if (typeof message.y !== "number")
                        return "y: number expected";
                if (message.z != null && message.hasOwnProperty("z"))
                    if (typeof message.z !== "number")
                        return "z: number expected";
                return null;
            };

            /**
             * Creates an Accel message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof lukuid.EnvironmentPayload.Accel
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {lukuid.EnvironmentPayload.Accel} Accel
             */
            Accel.fromObject = function fromObject(object) {
                if (object instanceof $root.lukuid.EnvironmentPayload.Accel)
                    return object;
                let message = new $root.lukuid.EnvironmentPayload.Accel();
                if (object.x != null)
                    message.x = Number(object.x);
                if (object.y != null)
                    message.y = Number(object.y);
                if (object.z != null)
                    message.z = Number(object.z);
                return message;
            };

            /**
             * Creates a plain object from an Accel message. Also converts values to other types if specified.
             * @function toObject
             * @memberof lukuid.EnvironmentPayload.Accel
             * @static
             * @param {lukuid.EnvironmentPayload.Accel} message Accel
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Accel.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.x = 0;
                    object.y = 0;
                    object.z = 0;
                }
                if (message.x != null && message.hasOwnProperty("x"))
                    object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
                if (message.y != null && message.hasOwnProperty("y"))
                    object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
                if (message.z != null && message.hasOwnProperty("z"))
                    object.z = options.json && !isFinite(message.z) ? String(message.z) : message.z;
                return object;
            };

            /**
             * Converts this Accel to JSON.
             * @function toJSON
             * @memberof lukuid.EnvironmentPayload.Accel
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Accel.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Accel
             * @function getTypeUrl
             * @memberof lukuid.EnvironmentPayload.Accel
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Accel.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/lukuid.EnvironmentPayload.Accel";
            };

            return Accel;
        })();

        return EnvironmentPayload;
    })();

    lukuid.EnvironmentRecord = (function() {

        /**
         * Properties of an EnvironmentRecord.
         * @memberof lukuid
         * @interface IEnvironmentRecord
         * @property {string|null} [version] EnvironmentRecord version
         * @property {string|null} [eventId] EnvironmentRecord eventId
         * @property {Uint8Array|null} [signature] EnvironmentRecord signature
         * @property {Uint8Array|null} [previousSignature] EnvironmentRecord previousSignature
         * @property {string|null} [canonicalString] EnvironmentRecord canonicalString
         * @property {lukuid.IEnvironmentPayload|null} [payload] EnvironmentRecord payload
         * @property {lukuid.IDeviceInfo|null} [device] EnvironmentRecord device
         * @property {Array.<lukuid.IAttachment>|null} [attachments] EnvironmentRecord attachments
         * @property {lukuid.IIdentity|null} [identity] EnvironmentRecord identity
         * @property {string|null} [alg] EnvironmentRecord alg
         */

        /**
         * Constructs a new EnvironmentRecord.
         * @memberof lukuid
         * @classdesc Represents an EnvironmentRecord.
         * @implements IEnvironmentRecord
         * @constructor
         * @param {lukuid.IEnvironmentRecord=} [properties] Properties to set
         */
        function EnvironmentRecord(properties) {
            this.attachments = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * EnvironmentRecord version.
         * @member {string} version
         * @memberof lukuid.EnvironmentRecord
         * @instance
         */
        EnvironmentRecord.prototype.version = "";

        /**
         * EnvironmentRecord eventId.
         * @member {string} eventId
         * @memberof lukuid.EnvironmentRecord
         * @instance
         */
        EnvironmentRecord.prototype.eventId = "";

        /**
         * EnvironmentRecord signature.
         * @member {Uint8Array} signature
         * @memberof lukuid.EnvironmentRecord
         * @instance
         */
        EnvironmentRecord.prototype.signature = $util.newBuffer([]);

        /**
         * EnvironmentRecord previousSignature.
         * @member {Uint8Array} previousSignature
         * @memberof lukuid.EnvironmentRecord
         * @instance
         */
        EnvironmentRecord.prototype.previousSignature = $util.newBuffer([]);

        /**
         * EnvironmentRecord canonicalString.
         * @member {string} canonicalString
         * @memberof lukuid.EnvironmentRecord
         * @instance
         */
        EnvironmentRecord.prototype.canonicalString = "";

        /**
         * EnvironmentRecord payload.
         * @member {lukuid.IEnvironmentPayload|null|undefined} payload
         * @memberof lukuid.EnvironmentRecord
         * @instance
         */
        EnvironmentRecord.prototype.payload = null;

        /**
         * EnvironmentRecord device.
         * @member {lukuid.IDeviceInfo|null|undefined} device
         * @memberof lukuid.EnvironmentRecord
         * @instance
         */
        EnvironmentRecord.prototype.device = null;

        /**
         * EnvironmentRecord attachments.
         * @member {Array.<lukuid.IAttachment>} attachments
         * @memberof lukuid.EnvironmentRecord
         * @instance
         */
        EnvironmentRecord.prototype.attachments = $util.emptyArray;

        /**
         * EnvironmentRecord identity.
         * @member {lukuid.IIdentity|null|undefined} identity
         * @memberof lukuid.EnvironmentRecord
         * @instance
         */
        EnvironmentRecord.prototype.identity = null;

        /**
         * EnvironmentRecord alg.
         * @member {string} alg
         * @memberof lukuid.EnvironmentRecord
         * @instance
         */
        EnvironmentRecord.prototype.alg = "";

        /**
         * Creates a new EnvironmentRecord instance using the specified properties.
         * @function create
         * @memberof lukuid.EnvironmentRecord
         * @static
         * @param {lukuid.IEnvironmentRecord=} [properties] Properties to set
         * @returns {lukuid.EnvironmentRecord} EnvironmentRecord instance
         */
        EnvironmentRecord.create = function create(properties) {
            return new EnvironmentRecord(properties);
        };

        /**
         * Encodes the specified EnvironmentRecord message. Does not implicitly {@link lukuid.EnvironmentRecord.verify|verify} messages.
         * @function encode
         * @memberof lukuid.EnvironmentRecord
         * @static
         * @param {lukuid.IEnvironmentRecord} message EnvironmentRecord message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EnvironmentRecord.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.version != null && Object.hasOwnProperty.call(message, "version"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.version);
            if (message.eventId != null && Object.hasOwnProperty.call(message, "eventId"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.eventId);
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.signature);
            if (message.previousSignature != null && Object.hasOwnProperty.call(message, "previousSignature"))
                writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.previousSignature);
            if (message.canonicalString != null && Object.hasOwnProperty.call(message, "canonicalString"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.canonicalString);
            if (message.payload != null && Object.hasOwnProperty.call(message, "payload"))
                $root.lukuid.EnvironmentPayload.encode(message.payload, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.device != null && Object.hasOwnProperty.call(message, "device"))
                $root.lukuid.DeviceInfo.encode(message.device, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            if (message.attachments != null && message.attachments.length)
                for (let i = 0; i < message.attachments.length; ++i)
                    $root.lukuid.Attachment.encode(message.attachments[i], writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
            if (message.identity != null && Object.hasOwnProperty.call(message, "identity"))
                $root.lukuid.Identity.encode(message.identity, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
            if (message.alg != null && Object.hasOwnProperty.call(message, "alg"))
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.alg);
            return writer;
        };

        /**
         * Encodes the specified EnvironmentRecord message, length delimited. Does not implicitly {@link lukuid.EnvironmentRecord.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.EnvironmentRecord
         * @static
         * @param {lukuid.IEnvironmentRecord} message EnvironmentRecord message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EnvironmentRecord.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an EnvironmentRecord message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.EnvironmentRecord
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.EnvironmentRecord} EnvironmentRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EnvironmentRecord.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.EnvironmentRecord();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.version = reader.string();
                        break;
                    }
                case 2: {
                        message.eventId = reader.string();
                        break;
                    }
                case 3: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 4: {
                        message.previousSignature = reader.bytes();
                        break;
                    }
                case 5: {
                        message.canonicalString = reader.string();
                        break;
                    }
                case 6: {
                        message.payload = $root.lukuid.EnvironmentPayload.decode(reader, reader.uint32());
                        break;
                    }
                case 7: {
                        message.device = $root.lukuid.DeviceInfo.decode(reader, reader.uint32());
                        break;
                    }
                case 8: {
                        if (!(message.attachments && message.attachments.length))
                            message.attachments = [];
                        message.attachments.push($root.lukuid.Attachment.decode(reader, reader.uint32()));
                        break;
                    }
                case 9: {
                        message.identity = $root.lukuid.Identity.decode(reader, reader.uint32());
                        break;
                    }
                case 10: {
                        message.alg = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an EnvironmentRecord message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.EnvironmentRecord
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.EnvironmentRecord} EnvironmentRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EnvironmentRecord.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EnvironmentRecord message.
         * @function verify
         * @memberof lukuid.EnvironmentRecord
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EnvironmentRecord.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.version != null && message.hasOwnProperty("version"))
                if (!$util.isString(message.version))
                    return "version: string expected";
            if (message.eventId != null && message.hasOwnProperty("eventId"))
                if (!$util.isString(message.eventId))
                    return "eventId: string expected";
            if (message.signature != null && message.hasOwnProperty("signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            if (message.previousSignature != null && message.hasOwnProperty("previousSignature"))
                if (!(message.previousSignature && typeof message.previousSignature.length === "number" || $util.isString(message.previousSignature)))
                    return "previousSignature: buffer expected";
            if (message.canonicalString != null && message.hasOwnProperty("canonicalString"))
                if (!$util.isString(message.canonicalString))
                    return "canonicalString: string expected";
            if (message.payload != null && message.hasOwnProperty("payload")) {
                let error = $root.lukuid.EnvironmentPayload.verify(message.payload);
                if (error)
                    return "payload." + error;
            }
            if (message.device != null && message.hasOwnProperty("device")) {
                let error = $root.lukuid.DeviceInfo.verify(message.device);
                if (error)
                    return "device." + error;
            }
            if (message.attachments != null && message.hasOwnProperty("attachments")) {
                if (!Array.isArray(message.attachments))
                    return "attachments: array expected";
                for (let i = 0; i < message.attachments.length; ++i) {
                    let error = $root.lukuid.Attachment.verify(message.attachments[i]);
                    if (error)
                        return "attachments." + error;
                }
            }
            if (message.identity != null && message.hasOwnProperty("identity")) {
                let error = $root.lukuid.Identity.verify(message.identity);
                if (error)
                    return "identity." + error;
            }
            if (message.alg != null && message.hasOwnProperty("alg"))
                if (!$util.isString(message.alg))
                    return "alg: string expected";
            return null;
        };

        /**
         * Creates an EnvironmentRecord message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.EnvironmentRecord
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.EnvironmentRecord} EnvironmentRecord
         */
        EnvironmentRecord.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.EnvironmentRecord)
                return object;
            let message = new $root.lukuid.EnvironmentRecord();
            if (object.version != null)
                message.version = String(object.version);
            if (object.eventId != null)
                message.eventId = String(object.eventId);
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.previousSignature != null)
                if (typeof object.previousSignature === "string")
                    $util.base64.decode(object.previousSignature, message.previousSignature = $util.newBuffer($util.base64.length(object.previousSignature)), 0);
                else if (object.previousSignature.length >= 0)
                    message.previousSignature = object.previousSignature;
            if (object.canonicalString != null)
                message.canonicalString = String(object.canonicalString);
            if (object.payload != null) {
                if (typeof object.payload !== "object")
                    throw TypeError(".lukuid.EnvironmentRecord.payload: object expected");
                message.payload = $root.lukuid.EnvironmentPayload.fromObject(object.payload);
            }
            if (object.device != null) {
                if (typeof object.device !== "object")
                    throw TypeError(".lukuid.EnvironmentRecord.device: object expected");
                message.device = $root.lukuid.DeviceInfo.fromObject(object.device);
            }
            if (object.attachments) {
                if (!Array.isArray(object.attachments))
                    throw TypeError(".lukuid.EnvironmentRecord.attachments: array expected");
                message.attachments = [];
                for (let i = 0; i < object.attachments.length; ++i) {
                    if (typeof object.attachments[i] !== "object")
                        throw TypeError(".lukuid.EnvironmentRecord.attachments: object expected");
                    message.attachments[i] = $root.lukuid.Attachment.fromObject(object.attachments[i]);
                }
            }
            if (object.identity != null) {
                if (typeof object.identity !== "object")
                    throw TypeError(".lukuid.EnvironmentRecord.identity: object expected");
                message.identity = $root.lukuid.Identity.fromObject(object.identity);
            }
            if (object.alg != null)
                message.alg = String(object.alg);
            return message;
        };

        /**
         * Creates a plain object from an EnvironmentRecord message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.EnvironmentRecord
         * @static
         * @param {lukuid.EnvironmentRecord} message EnvironmentRecord
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EnvironmentRecord.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.attachments = [];
            if (options.defaults) {
                object.version = "";
                object.eventId = "";
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
                if (options.bytes === String)
                    object.previousSignature = "";
                else {
                    object.previousSignature = [];
                    if (options.bytes !== Array)
                        object.previousSignature = $util.newBuffer(object.previousSignature);
                }
                object.canonicalString = "";
                object.payload = null;
                object.device = null;
                object.identity = null;
                object.alg = "";
            }
            if (message.version != null && message.hasOwnProperty("version"))
                object.version = message.version;
            if (message.eventId != null && message.hasOwnProperty("eventId"))
                object.eventId = message.eventId;
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            if (message.previousSignature != null && message.hasOwnProperty("previousSignature"))
                object.previousSignature = options.bytes === String ? $util.base64.encode(message.previousSignature, 0, message.previousSignature.length) : options.bytes === Array ? Array.prototype.slice.call(message.previousSignature) : message.previousSignature;
            if (message.canonicalString != null && message.hasOwnProperty("canonicalString"))
                object.canonicalString = message.canonicalString;
            if (message.payload != null && message.hasOwnProperty("payload"))
                object.payload = $root.lukuid.EnvironmentPayload.toObject(message.payload, options);
            if (message.device != null && message.hasOwnProperty("device"))
                object.device = $root.lukuid.DeviceInfo.toObject(message.device, options);
            if (message.attachments && message.attachments.length) {
                object.attachments = [];
                for (let j = 0; j < message.attachments.length; ++j)
                    object.attachments[j] = $root.lukuid.Attachment.toObject(message.attachments[j], options);
            }
            if (message.identity != null && message.hasOwnProperty("identity"))
                object.identity = $root.lukuid.Identity.toObject(message.identity, options);
            if (message.alg != null && message.hasOwnProperty("alg"))
                object.alg = message.alg;
            return object;
        };

        /**
         * Converts this EnvironmentRecord to JSON.
         * @function toJSON
         * @memberof lukuid.EnvironmentRecord
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EnvironmentRecord.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for EnvironmentRecord
         * @function getTypeUrl
         * @memberof lukuid.EnvironmentRecord
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        EnvironmentRecord.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.EnvironmentRecord";
        };

        return EnvironmentRecord;
    })();

    lukuid.RecordBatch = (function() {

        /**
         * Properties of a RecordBatch.
         * @memberof lukuid
         * @interface IRecordBatch
         * @property {Uint8Array|null} [attestationDacDer] RecordBatch attestationDacDer
         * @property {Uint8Array|null} [attestationManufacturerDer] RecordBatch attestationManufacturerDer
         * @property {Uint8Array|null} [attestationIntermediateDer] RecordBatch attestationIntermediateDer
         * @property {Uint8Array|null} [heartbeatSlacDer] RecordBatch heartbeatSlacDer
         * @property {Uint8Array|null} [heartbeatDer] RecordBatch heartbeatDer
         * @property {Uint8Array|null} [heartbeatIntermediateDer] RecordBatch heartbeatIntermediateDer
         * @property {lukuid.IDeviceInfo|null} [device] RecordBatch device
         * @property {Array.<lukuid.IEnvironmentRecord>|null} [environmentRecords] RecordBatch environmentRecords
         * @property {Array.<lukuid.IScanRecord>|null} [scanRecords] RecordBatch scanRecords
         * @property {Array.<lukuid.IAttachmentRecord>|null} [attachmentRecords] RecordBatch attachmentRecords
         * @property {string|null} [attestationRootFingerprint] RecordBatch attestationRootFingerprint
         * @property {string|null} [heartbeatRootFingerprint] RecordBatch heartbeatRootFingerprint
         */

        /**
         * Constructs a new RecordBatch.
         * @memberof lukuid
         * @classdesc Represents a RecordBatch.
         * @implements IRecordBatch
         * @constructor
         * @param {lukuid.IRecordBatch=} [properties] Properties to set
         */
        function RecordBatch(properties) {
            this.environmentRecords = [];
            this.scanRecords = [];
            this.attachmentRecords = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RecordBatch attestationDacDer.
         * @member {Uint8Array} attestationDacDer
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.attestationDacDer = $util.newBuffer([]);

        /**
         * RecordBatch attestationManufacturerDer.
         * @member {Uint8Array} attestationManufacturerDer
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.attestationManufacturerDer = $util.newBuffer([]);

        /**
         * RecordBatch attestationIntermediateDer.
         * @member {Uint8Array} attestationIntermediateDer
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.attestationIntermediateDer = $util.newBuffer([]);

        /**
         * RecordBatch heartbeatSlacDer.
         * @member {Uint8Array} heartbeatSlacDer
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.heartbeatSlacDer = $util.newBuffer([]);

        /**
         * RecordBatch heartbeatDer.
         * @member {Uint8Array} heartbeatDer
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.heartbeatDer = $util.newBuffer([]);

        /**
         * RecordBatch heartbeatIntermediateDer.
         * @member {Uint8Array} heartbeatIntermediateDer
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.heartbeatIntermediateDer = $util.newBuffer([]);

        /**
         * RecordBatch device.
         * @member {lukuid.IDeviceInfo|null|undefined} device
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.device = null;

        /**
         * RecordBatch environmentRecords.
         * @member {Array.<lukuid.IEnvironmentRecord>} environmentRecords
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.environmentRecords = $util.emptyArray;

        /**
         * RecordBatch scanRecords.
         * @member {Array.<lukuid.IScanRecord>} scanRecords
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.scanRecords = $util.emptyArray;

        /**
         * RecordBatch attachmentRecords.
         * @member {Array.<lukuid.IAttachmentRecord>} attachmentRecords
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.attachmentRecords = $util.emptyArray;

        /**
         * RecordBatch attestationRootFingerprint.
         * @member {string} attestationRootFingerprint
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.attestationRootFingerprint = "";

        /**
         * RecordBatch heartbeatRootFingerprint.
         * @member {string} heartbeatRootFingerprint
         * @memberof lukuid.RecordBatch
         * @instance
         */
        RecordBatch.prototype.heartbeatRootFingerprint = "";

        /**
         * Creates a new RecordBatch instance using the specified properties.
         * @function create
         * @memberof lukuid.RecordBatch
         * @static
         * @param {lukuid.IRecordBatch=} [properties] Properties to set
         * @returns {lukuid.RecordBatch} RecordBatch instance
         */
        RecordBatch.create = function create(properties) {
            return new RecordBatch(properties);
        };

        /**
         * Encodes the specified RecordBatch message. Does not implicitly {@link lukuid.RecordBatch.verify|verify} messages.
         * @function encode
         * @memberof lukuid.RecordBatch
         * @static
         * @param {lukuid.IRecordBatch} message RecordBatch message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecordBatch.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.attestationDacDer != null && Object.hasOwnProperty.call(message, "attestationDacDer"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.attestationDacDer);
            if (message.attestationManufacturerDer != null && Object.hasOwnProperty.call(message, "attestationManufacturerDer"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.attestationManufacturerDer);
            if (message.attestationIntermediateDer != null && Object.hasOwnProperty.call(message, "attestationIntermediateDer"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.attestationIntermediateDer);
            if (message.heartbeatSlacDer != null && Object.hasOwnProperty.call(message, "heartbeatSlacDer"))
                writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.heartbeatSlacDer);
            if (message.heartbeatDer != null && Object.hasOwnProperty.call(message, "heartbeatDer"))
                writer.uint32(/* id 5, wireType 2 =*/42).bytes(message.heartbeatDer);
            if (message.heartbeatIntermediateDer != null && Object.hasOwnProperty.call(message, "heartbeatIntermediateDer"))
                writer.uint32(/* id 6, wireType 2 =*/50).bytes(message.heartbeatIntermediateDer);
            if (message.device != null && Object.hasOwnProperty.call(message, "device"))
                $root.lukuid.DeviceInfo.encode(message.device, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            if (message.environmentRecords != null && message.environmentRecords.length)
                for (let i = 0; i < message.environmentRecords.length; ++i)
                    $root.lukuid.EnvironmentRecord.encode(message.environmentRecords[i], writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
            if (message.scanRecords != null && message.scanRecords.length)
                for (let i = 0; i < message.scanRecords.length; ++i)
                    $root.lukuid.ScanRecord.encode(message.scanRecords[i], writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
            if (message.attestationRootFingerprint != null && Object.hasOwnProperty.call(message, "attestationRootFingerprint"))
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.attestationRootFingerprint);
            if (message.heartbeatRootFingerprint != null && Object.hasOwnProperty.call(message, "heartbeatRootFingerprint"))
                writer.uint32(/* id 11, wireType 2 =*/90).string(message.heartbeatRootFingerprint);
            if (message.attachmentRecords != null && message.attachmentRecords.length)
                for (let i = 0; i < message.attachmentRecords.length; ++i)
                    $root.lukuid.AttachmentRecord.encode(message.attachmentRecords[i], writer.uint32(/* id 13, wireType 2 =*/106).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified RecordBatch message, length delimited. Does not implicitly {@link lukuid.RecordBatch.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.RecordBatch
         * @static
         * @param {lukuid.IRecordBatch} message RecordBatch message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecordBatch.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RecordBatch message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.RecordBatch
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.RecordBatch} RecordBatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecordBatch.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.RecordBatch();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.attestationDacDer = reader.bytes();
                        break;
                    }
                case 2: {
                        message.attestationManufacturerDer = reader.bytes();
                        break;
                    }
                case 3: {
                        message.attestationIntermediateDer = reader.bytes();
                        break;
                    }
                case 4: {
                        message.heartbeatSlacDer = reader.bytes();
                        break;
                    }
                case 5: {
                        message.heartbeatDer = reader.bytes();
                        break;
                    }
                case 6: {
                        message.heartbeatIntermediateDer = reader.bytes();
                        break;
                    }
                case 7: {
                        message.device = $root.lukuid.DeviceInfo.decode(reader, reader.uint32());
                        break;
                    }
                case 8: {
                        if (!(message.environmentRecords && message.environmentRecords.length))
                            message.environmentRecords = [];
                        message.environmentRecords.push($root.lukuid.EnvironmentRecord.decode(reader, reader.uint32()));
                        break;
                    }
                case 9: {
                        if (!(message.scanRecords && message.scanRecords.length))
                            message.scanRecords = [];
                        message.scanRecords.push($root.lukuid.ScanRecord.decode(reader, reader.uint32()));
                        break;
                    }
                case 13: {
                        if (!(message.attachmentRecords && message.attachmentRecords.length))
                            message.attachmentRecords = [];
                        message.attachmentRecords.push($root.lukuid.AttachmentRecord.decode(reader, reader.uint32()));
                        break;
                    }
                case 10: {
                        message.attestationRootFingerprint = reader.string();
                        break;
                    }
                case 11: {
                        message.heartbeatRootFingerprint = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RecordBatch message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.RecordBatch
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.RecordBatch} RecordBatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecordBatch.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RecordBatch message.
         * @function verify
         * @memberof lukuid.RecordBatch
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RecordBatch.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.attestationDacDer != null && message.hasOwnProperty("attestationDacDer"))
                if (!(message.attestationDacDer && typeof message.attestationDacDer.length === "number" || $util.isString(message.attestationDacDer)))
                    return "attestationDacDer: buffer expected";
            if (message.attestationManufacturerDer != null && message.hasOwnProperty("attestationManufacturerDer"))
                if (!(message.attestationManufacturerDer && typeof message.attestationManufacturerDer.length === "number" || $util.isString(message.attestationManufacturerDer)))
                    return "attestationManufacturerDer: buffer expected";
            if (message.attestationIntermediateDer != null && message.hasOwnProperty("attestationIntermediateDer"))
                if (!(message.attestationIntermediateDer && typeof message.attestationIntermediateDer.length === "number" || $util.isString(message.attestationIntermediateDer)))
                    return "attestationIntermediateDer: buffer expected";
            if (message.heartbeatSlacDer != null && message.hasOwnProperty("heartbeatSlacDer"))
                if (!(message.heartbeatSlacDer && typeof message.heartbeatSlacDer.length === "number" || $util.isString(message.heartbeatSlacDer)))
                    return "heartbeatSlacDer: buffer expected";
            if (message.heartbeatDer != null && message.hasOwnProperty("heartbeatDer"))
                if (!(message.heartbeatDer && typeof message.heartbeatDer.length === "number" || $util.isString(message.heartbeatDer)))
                    return "heartbeatDer: buffer expected";
            if (message.heartbeatIntermediateDer != null && message.hasOwnProperty("heartbeatIntermediateDer"))
                if (!(message.heartbeatIntermediateDer && typeof message.heartbeatIntermediateDer.length === "number" || $util.isString(message.heartbeatIntermediateDer)))
                    return "heartbeatIntermediateDer: buffer expected";
            if (message.device != null && message.hasOwnProperty("device")) {
                let error = $root.lukuid.DeviceInfo.verify(message.device);
                if (error)
                    return "device." + error;
            }
            if (message.environmentRecords != null && message.hasOwnProperty("environmentRecords")) {
                if (!Array.isArray(message.environmentRecords))
                    return "environmentRecords: array expected";
                for (let i = 0; i < message.environmentRecords.length; ++i) {
                    let error = $root.lukuid.EnvironmentRecord.verify(message.environmentRecords[i]);
                    if (error)
                        return "environmentRecords." + error;
                }
            }
            if (message.scanRecords != null && message.hasOwnProperty("scanRecords")) {
                if (!Array.isArray(message.scanRecords))
                    return "scanRecords: array expected";
                for (let i = 0; i < message.scanRecords.length; ++i) {
                    let error = $root.lukuid.ScanRecord.verify(message.scanRecords[i]);
                    if (error)
                        return "scanRecords." + error;
                }
            }
            if (message.attachmentRecords != null && message.hasOwnProperty("attachmentRecords")) {
                if (!Array.isArray(message.attachmentRecords))
                    return "attachmentRecords: array expected";
                for (let i = 0; i < message.attachmentRecords.length; ++i) {
                    let error = $root.lukuid.AttachmentRecord.verify(message.attachmentRecords[i]);
                    if (error)
                        return "attachmentRecords." + error;
                }
            }
            if (message.attestationRootFingerprint != null && message.hasOwnProperty("attestationRootFingerprint"))
                if (!$util.isString(message.attestationRootFingerprint))
                    return "attestationRootFingerprint: string expected";
            if (message.heartbeatRootFingerprint != null && message.hasOwnProperty("heartbeatRootFingerprint"))
                if (!$util.isString(message.heartbeatRootFingerprint))
                    return "heartbeatRootFingerprint: string expected";
            return null;
        };

        /**
         * Creates a RecordBatch message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.RecordBatch
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.RecordBatch} RecordBatch
         */
        RecordBatch.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.RecordBatch)
                return object;
            let message = new $root.lukuid.RecordBatch();
            if (object.attestationDacDer != null)
                if (typeof object.attestationDacDer === "string")
                    $util.base64.decode(object.attestationDacDer, message.attestationDacDer = $util.newBuffer($util.base64.length(object.attestationDacDer)), 0);
                else if (object.attestationDacDer.length >= 0)
                    message.attestationDacDer = object.attestationDacDer;
            if (object.attestationManufacturerDer != null)
                if (typeof object.attestationManufacturerDer === "string")
                    $util.base64.decode(object.attestationManufacturerDer, message.attestationManufacturerDer = $util.newBuffer($util.base64.length(object.attestationManufacturerDer)), 0);
                else if (object.attestationManufacturerDer.length >= 0)
                    message.attestationManufacturerDer = object.attestationManufacturerDer;
            if (object.attestationIntermediateDer != null)
                if (typeof object.attestationIntermediateDer === "string")
                    $util.base64.decode(object.attestationIntermediateDer, message.attestationIntermediateDer = $util.newBuffer($util.base64.length(object.attestationIntermediateDer)), 0);
                else if (object.attestationIntermediateDer.length >= 0)
                    message.attestationIntermediateDer = object.attestationIntermediateDer;
            if (object.heartbeatSlacDer != null)
                if (typeof object.heartbeatSlacDer === "string")
                    $util.base64.decode(object.heartbeatSlacDer, message.heartbeatSlacDer = $util.newBuffer($util.base64.length(object.heartbeatSlacDer)), 0);
                else if (object.heartbeatSlacDer.length >= 0)
                    message.heartbeatSlacDer = object.heartbeatSlacDer;
            if (object.heartbeatDer != null)
                if (typeof object.heartbeatDer === "string")
                    $util.base64.decode(object.heartbeatDer, message.heartbeatDer = $util.newBuffer($util.base64.length(object.heartbeatDer)), 0);
                else if (object.heartbeatDer.length >= 0)
                    message.heartbeatDer = object.heartbeatDer;
            if (object.heartbeatIntermediateDer != null)
                if (typeof object.heartbeatIntermediateDer === "string")
                    $util.base64.decode(object.heartbeatIntermediateDer, message.heartbeatIntermediateDer = $util.newBuffer($util.base64.length(object.heartbeatIntermediateDer)), 0);
                else if (object.heartbeatIntermediateDer.length >= 0)
                    message.heartbeatIntermediateDer = object.heartbeatIntermediateDer;
            if (object.device != null) {
                if (typeof object.device !== "object")
                    throw TypeError(".lukuid.RecordBatch.device: object expected");
                message.device = $root.lukuid.DeviceInfo.fromObject(object.device);
            }
            if (object.environmentRecords) {
                if (!Array.isArray(object.environmentRecords))
                    throw TypeError(".lukuid.RecordBatch.environmentRecords: array expected");
                message.environmentRecords = [];
                for (let i = 0; i < object.environmentRecords.length; ++i) {
                    if (typeof object.environmentRecords[i] !== "object")
                        throw TypeError(".lukuid.RecordBatch.environmentRecords: object expected");
                    message.environmentRecords[i] = $root.lukuid.EnvironmentRecord.fromObject(object.environmentRecords[i]);
                }
            }
            if (object.scanRecords) {
                if (!Array.isArray(object.scanRecords))
                    throw TypeError(".lukuid.RecordBatch.scanRecords: array expected");
                message.scanRecords = [];
                for (let i = 0; i < object.scanRecords.length; ++i) {
                    if (typeof object.scanRecords[i] !== "object")
                        throw TypeError(".lukuid.RecordBatch.scanRecords: object expected");
                    message.scanRecords[i] = $root.lukuid.ScanRecord.fromObject(object.scanRecords[i]);
                }
            }
            if (object.attachmentRecords) {
                if (!Array.isArray(object.attachmentRecords))
                    throw TypeError(".lukuid.RecordBatch.attachmentRecords: array expected");
                message.attachmentRecords = [];
                for (let i = 0; i < object.attachmentRecords.length; ++i) {
                    if (typeof object.attachmentRecords[i] !== "object")
                        throw TypeError(".lukuid.RecordBatch.attachmentRecords: object expected");
                    message.attachmentRecords[i] = $root.lukuid.AttachmentRecord.fromObject(object.attachmentRecords[i]);
                }
            }
            if (object.attestationRootFingerprint != null)
                message.attestationRootFingerprint = String(object.attestationRootFingerprint);
            if (object.heartbeatRootFingerprint != null)
                message.heartbeatRootFingerprint = String(object.heartbeatRootFingerprint);
            return message;
        };

        /**
         * Creates a plain object from a RecordBatch message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.RecordBatch
         * @static
         * @param {lukuid.RecordBatch} message RecordBatch
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RecordBatch.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults) {
                object.environmentRecords = [];
                object.scanRecords = [];
                object.attachmentRecords = [];
            }
            if (options.defaults) {
                if (options.bytes === String)
                    object.attestationDacDer = "";
                else {
                    object.attestationDacDer = [];
                    if (options.bytes !== Array)
                        object.attestationDacDer = $util.newBuffer(object.attestationDacDer);
                }
                if (options.bytes === String)
                    object.attestationManufacturerDer = "";
                else {
                    object.attestationManufacturerDer = [];
                    if (options.bytes !== Array)
                        object.attestationManufacturerDer = $util.newBuffer(object.attestationManufacturerDer);
                }
                if (options.bytes === String)
                    object.attestationIntermediateDer = "";
                else {
                    object.attestationIntermediateDer = [];
                    if (options.bytes !== Array)
                        object.attestationIntermediateDer = $util.newBuffer(object.attestationIntermediateDer);
                }
                if (options.bytes === String)
                    object.heartbeatSlacDer = "";
                else {
                    object.heartbeatSlacDer = [];
                    if (options.bytes !== Array)
                        object.heartbeatSlacDer = $util.newBuffer(object.heartbeatSlacDer);
                }
                if (options.bytes === String)
                    object.heartbeatDer = "";
                else {
                    object.heartbeatDer = [];
                    if (options.bytes !== Array)
                        object.heartbeatDer = $util.newBuffer(object.heartbeatDer);
                }
                if (options.bytes === String)
                    object.heartbeatIntermediateDer = "";
                else {
                    object.heartbeatIntermediateDer = [];
                    if (options.bytes !== Array)
                        object.heartbeatIntermediateDer = $util.newBuffer(object.heartbeatIntermediateDer);
                }
                object.device = null;
                object.attestationRootFingerprint = "";
                object.heartbeatRootFingerprint = "";
            }
            if (message.attestationDacDer != null && message.hasOwnProperty("attestationDacDer"))
                object.attestationDacDer = options.bytes === String ? $util.base64.encode(message.attestationDacDer, 0, message.attestationDacDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.attestationDacDer) : message.attestationDacDer;
            if (message.attestationManufacturerDer != null && message.hasOwnProperty("attestationManufacturerDer"))
                object.attestationManufacturerDer = options.bytes === String ? $util.base64.encode(message.attestationManufacturerDer, 0, message.attestationManufacturerDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.attestationManufacturerDer) : message.attestationManufacturerDer;
            if (message.attestationIntermediateDer != null && message.hasOwnProperty("attestationIntermediateDer"))
                object.attestationIntermediateDer = options.bytes === String ? $util.base64.encode(message.attestationIntermediateDer, 0, message.attestationIntermediateDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.attestationIntermediateDer) : message.attestationIntermediateDer;
            if (message.heartbeatSlacDer != null && message.hasOwnProperty("heartbeatSlacDer"))
                object.heartbeatSlacDer = options.bytes === String ? $util.base64.encode(message.heartbeatSlacDer, 0, message.heartbeatSlacDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.heartbeatSlacDer) : message.heartbeatSlacDer;
            if (message.heartbeatDer != null && message.hasOwnProperty("heartbeatDer"))
                object.heartbeatDer = options.bytes === String ? $util.base64.encode(message.heartbeatDer, 0, message.heartbeatDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.heartbeatDer) : message.heartbeatDer;
            if (message.heartbeatIntermediateDer != null && message.hasOwnProperty("heartbeatIntermediateDer"))
                object.heartbeatIntermediateDer = options.bytes === String ? $util.base64.encode(message.heartbeatIntermediateDer, 0, message.heartbeatIntermediateDer.length) : options.bytes === Array ? Array.prototype.slice.call(message.heartbeatIntermediateDer) : message.heartbeatIntermediateDer;
            if (message.device != null && message.hasOwnProperty("device"))
                object.device = $root.lukuid.DeviceInfo.toObject(message.device, options);
            if (message.environmentRecords && message.environmentRecords.length) {
                object.environmentRecords = [];
                for (let j = 0; j < message.environmentRecords.length; ++j)
                    object.environmentRecords[j] = $root.lukuid.EnvironmentRecord.toObject(message.environmentRecords[j], options);
            }
            if (message.scanRecords && message.scanRecords.length) {
                object.scanRecords = [];
                for (let j = 0; j < message.scanRecords.length; ++j)
                    object.scanRecords[j] = $root.lukuid.ScanRecord.toObject(message.scanRecords[j], options);
            }
            if (message.attestationRootFingerprint != null && message.hasOwnProperty("attestationRootFingerprint"))
                object.attestationRootFingerprint = message.attestationRootFingerprint;
            if (message.heartbeatRootFingerprint != null && message.hasOwnProperty("heartbeatRootFingerprint"))
                object.heartbeatRootFingerprint = message.heartbeatRootFingerprint;
            if (message.attachmentRecords && message.attachmentRecords.length) {
                object.attachmentRecords = [];
                for (let j = 0; j < message.attachmentRecords.length; ++j)
                    object.attachmentRecords[j] = $root.lukuid.AttachmentRecord.toObject(message.attachmentRecords[j], options);
            }
            return object;
        };

        /**
         * Converts this RecordBatch to JSON.
         * @function toJSON
         * @memberof lukuid.RecordBatch
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RecordBatch.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for RecordBatch
         * @function getTypeUrl
         * @memberof lukuid.RecordBatch
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        RecordBatch.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.RecordBatch";
        };

        return RecordBatch;
    })();

    lukuid.RecordBatches = (function() {

        /**
         * Properties of a RecordBatches.
         * @memberof lukuid
         * @interface IRecordBatches
         * @property {Array.<lukuid.IRecordBatch>|null} [batches] RecordBatches batches
         */

        /**
         * Constructs a new RecordBatches.
         * @memberof lukuid
         * @classdesc Represents a RecordBatches.
         * @implements IRecordBatches
         * @constructor
         * @param {lukuid.IRecordBatches=} [properties] Properties to set
         */
        function RecordBatches(properties) {
            this.batches = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RecordBatches batches.
         * @member {Array.<lukuid.IRecordBatch>} batches
         * @memberof lukuid.RecordBatches
         * @instance
         */
        RecordBatches.prototype.batches = $util.emptyArray;

        /**
         * Creates a new RecordBatches instance using the specified properties.
         * @function create
         * @memberof lukuid.RecordBatches
         * @static
         * @param {lukuid.IRecordBatches=} [properties] Properties to set
         * @returns {lukuid.RecordBatches} RecordBatches instance
         */
        RecordBatches.create = function create(properties) {
            return new RecordBatches(properties);
        };

        /**
         * Encodes the specified RecordBatches message. Does not implicitly {@link lukuid.RecordBatches.verify|verify} messages.
         * @function encode
         * @memberof lukuid.RecordBatches
         * @static
         * @param {lukuid.IRecordBatches} message RecordBatches message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecordBatches.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.batches != null && message.batches.length)
                for (let i = 0; i < message.batches.length; ++i)
                    $root.lukuid.RecordBatch.encode(message.batches[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified RecordBatches message, length delimited. Does not implicitly {@link lukuid.RecordBatches.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.RecordBatches
         * @static
         * @param {lukuid.IRecordBatches} message RecordBatches message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecordBatches.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RecordBatches message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.RecordBatches
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.RecordBatches} RecordBatches
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecordBatches.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.RecordBatches();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.batches && message.batches.length))
                            message.batches = [];
                        message.batches.push($root.lukuid.RecordBatch.decode(reader, reader.uint32()));
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RecordBatches message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.RecordBatches
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.RecordBatches} RecordBatches
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecordBatches.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RecordBatches message.
         * @function verify
         * @memberof lukuid.RecordBatches
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RecordBatches.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.batches != null && message.hasOwnProperty("batches")) {
                if (!Array.isArray(message.batches))
                    return "batches: array expected";
                for (let i = 0; i < message.batches.length; ++i) {
                    let error = $root.lukuid.RecordBatch.verify(message.batches[i]);
                    if (error)
                        return "batches." + error;
                }
            }
            return null;
        };

        /**
         * Creates a RecordBatches message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.RecordBatches
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.RecordBatches} RecordBatches
         */
        RecordBatches.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.RecordBatches)
                return object;
            let message = new $root.lukuid.RecordBatches();
            if (object.batches) {
                if (!Array.isArray(object.batches))
                    throw TypeError(".lukuid.RecordBatches.batches: array expected");
                message.batches = [];
                for (let i = 0; i < object.batches.length; ++i) {
                    if (typeof object.batches[i] !== "object")
                        throw TypeError(".lukuid.RecordBatches.batches: object expected");
                    message.batches[i] = $root.lukuid.RecordBatch.fromObject(object.batches[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a RecordBatches message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.RecordBatches
         * @static
         * @param {lukuid.RecordBatches} message RecordBatches
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RecordBatches.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.batches = [];
            if (message.batches && message.batches.length) {
                object.batches = [];
                for (let j = 0; j < message.batches.length; ++j)
                    object.batches[j] = $root.lukuid.RecordBatch.toObject(message.batches[j], options);
            }
            return object;
        };

        /**
         * Converts this RecordBatches to JSON.
         * @function toJSON
         * @memberof lukuid.RecordBatches
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RecordBatches.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for RecordBatches
         * @function getTypeUrl
         * @memberof lukuid.RecordBatches
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        RecordBatches.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.RecordBatches";
        };

        return RecordBatches;
    })();

    lukuid.FullRecordResponse = (function() {

        /**
         * Properties of a FullRecordResponse.
         * @memberof lukuid
         * @interface IFullRecordResponse
         * @property {string|null} [recordId] FullRecordResponse recordId
         * @property {lukuid.IScanRecord|null} [scanFull] FullRecordResponse scanFull
         * @property {lukuid.IEnvironmentRecord|null} [environmentFull] FullRecordResponse environmentFull
         */

        /**
         * Constructs a new FullRecordResponse.
         * @memberof lukuid
         * @classdesc Represents a FullRecordResponse.
         * @implements IFullRecordResponse
         * @constructor
         * @param {lukuid.IFullRecordResponse=} [properties] Properties to set
         */
        function FullRecordResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * FullRecordResponse recordId.
         * @member {string} recordId
         * @memberof lukuid.FullRecordResponse
         * @instance
         */
        FullRecordResponse.prototype.recordId = "";

        /**
         * FullRecordResponse scanFull.
         * @member {lukuid.IScanRecord|null|undefined} scanFull
         * @memberof lukuid.FullRecordResponse
         * @instance
         */
        FullRecordResponse.prototype.scanFull = null;

        /**
         * FullRecordResponse environmentFull.
         * @member {lukuid.IEnvironmentRecord|null|undefined} environmentFull
         * @memberof lukuid.FullRecordResponse
         * @instance
         */
        FullRecordResponse.prototype.environmentFull = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * FullRecordResponse fullRecord.
         * @member {"scanFull"|"environmentFull"|undefined} fullRecord
         * @memberof lukuid.FullRecordResponse
         * @instance
         */
        Object.defineProperty(FullRecordResponse.prototype, "fullRecord", {
            get: $util.oneOfGetter($oneOfFields = ["scanFull", "environmentFull"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new FullRecordResponse instance using the specified properties.
         * @function create
         * @memberof lukuid.FullRecordResponse
         * @static
         * @param {lukuid.IFullRecordResponse=} [properties] Properties to set
         * @returns {lukuid.FullRecordResponse} FullRecordResponse instance
         */
        FullRecordResponse.create = function create(properties) {
            return new FullRecordResponse(properties);
        };

        /**
         * Encodes the specified FullRecordResponse message. Does not implicitly {@link lukuid.FullRecordResponse.verify|verify} messages.
         * @function encode
         * @memberof lukuid.FullRecordResponse
         * @static
         * @param {lukuid.IFullRecordResponse} message FullRecordResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FullRecordResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.recordId != null && Object.hasOwnProperty.call(message, "recordId"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.recordId);
            if (message.scanFull != null && Object.hasOwnProperty.call(message, "scanFull"))
                $root.lukuid.ScanRecord.encode(message.scanFull, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.environmentFull != null && Object.hasOwnProperty.call(message, "environmentFull"))
                $root.lukuid.EnvironmentRecord.encode(message.environmentFull, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified FullRecordResponse message, length delimited. Does not implicitly {@link lukuid.FullRecordResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.FullRecordResponse
         * @static
         * @param {lukuid.IFullRecordResponse} message FullRecordResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FullRecordResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a FullRecordResponse message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.FullRecordResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.FullRecordResponse} FullRecordResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FullRecordResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.FullRecordResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.recordId = reader.string();
                        break;
                    }
                case 2: {
                        message.scanFull = $root.lukuid.ScanRecord.decode(reader, reader.uint32());
                        break;
                    }
                case 3: {
                        message.environmentFull = $root.lukuid.EnvironmentRecord.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a FullRecordResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.FullRecordResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.FullRecordResponse} FullRecordResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FullRecordResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a FullRecordResponse message.
         * @function verify
         * @memberof lukuid.FullRecordResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        FullRecordResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.recordId != null && message.hasOwnProperty("recordId"))
                if (!$util.isString(message.recordId))
                    return "recordId: string expected";
            if (message.scanFull != null && message.hasOwnProperty("scanFull")) {
                properties.fullRecord = 1;
                {
                    let error = $root.lukuid.ScanRecord.verify(message.scanFull);
                    if (error)
                        return "scanFull." + error;
                }
            }
            if (message.environmentFull != null && message.hasOwnProperty("environmentFull")) {
                if (properties.fullRecord === 1)
                    return "fullRecord: multiple values";
                properties.fullRecord = 1;
                {
                    let error = $root.lukuid.EnvironmentRecord.verify(message.environmentFull);
                    if (error)
                        return "environmentFull." + error;
                }
            }
            return null;
        };

        /**
         * Creates a FullRecordResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.FullRecordResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.FullRecordResponse} FullRecordResponse
         */
        FullRecordResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.FullRecordResponse)
                return object;
            let message = new $root.lukuid.FullRecordResponse();
            if (object.recordId != null)
                message.recordId = String(object.recordId);
            if (object.scanFull != null) {
                if (typeof object.scanFull !== "object")
                    throw TypeError(".lukuid.FullRecordResponse.scanFull: object expected");
                message.scanFull = $root.lukuid.ScanRecord.fromObject(object.scanFull);
            }
            if (object.environmentFull != null) {
                if (typeof object.environmentFull !== "object")
                    throw TypeError(".lukuid.FullRecordResponse.environmentFull: object expected");
                message.environmentFull = $root.lukuid.EnvironmentRecord.fromObject(object.environmentFull);
            }
            return message;
        };

        /**
         * Creates a plain object from a FullRecordResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.FullRecordResponse
         * @static
         * @param {lukuid.FullRecordResponse} message FullRecordResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        FullRecordResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.recordId = "";
            if (message.recordId != null && message.hasOwnProperty("recordId"))
                object.recordId = message.recordId;
            if (message.scanFull != null && message.hasOwnProperty("scanFull")) {
                object.scanFull = $root.lukuid.ScanRecord.toObject(message.scanFull, options);
                if (options.oneofs)
                    object.fullRecord = "scanFull";
            }
            if (message.environmentFull != null && message.hasOwnProperty("environmentFull")) {
                object.environmentFull = $root.lukuid.EnvironmentRecord.toObject(message.environmentFull, options);
                if (options.oneofs)
                    object.fullRecord = "environmentFull";
            }
            return object;
        };

        /**
         * Converts this FullRecordResponse to JSON.
         * @function toJSON
         * @memberof lukuid.FullRecordResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        FullRecordResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for FullRecordResponse
         * @function getTypeUrl
         * @memberof lukuid.FullRecordResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        FullRecordResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.FullRecordResponse";
        };

        return FullRecordResponse;
    })();

    lukuid.HeartbeatInitResponse = (function() {

        /**
         * Properties of a HeartbeatInitResponse.
         * @memberof lukuid
         * @interface IHeartbeatInitResponse
         * @property {string|null} [signatureB64] HeartbeatInitResponse signatureB64
         * @property {string|null} [csrPem] HeartbeatInitResponse csrPem
         * @property {string|null} [attestationB64] HeartbeatInitResponse attestationB64
         * @property {number|Long|null} [counter] HeartbeatInitResponse counter
         * @property {number|Long|null} [lastSyncBucket] HeartbeatInitResponse lastSyncBucket
         * @property {number|Long|null} [latestTimestamp] HeartbeatInitResponse latestTimestamp
         * @property {number|Long|null} [currentTimestamp] HeartbeatInitResponse currentTimestamp
         * @property {string|null} [lastIntermediateSerial] HeartbeatInitResponse lastIntermediateSerial
         * @property {string|null} [lastSlacSerial] HeartbeatInitResponse lastSlacSerial
         */

        /**
         * Constructs a new HeartbeatInitResponse.
         * @memberof lukuid
         * @classdesc Represents a HeartbeatInitResponse.
         * @implements IHeartbeatInitResponse
         * @constructor
         * @param {lukuid.IHeartbeatInitResponse=} [properties] Properties to set
         */
        function HeartbeatInitResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * HeartbeatInitResponse signatureB64.
         * @member {string} signatureB64
         * @memberof lukuid.HeartbeatInitResponse
         * @instance
         */
        HeartbeatInitResponse.prototype.signatureB64 = "";

        /**
         * HeartbeatInitResponse csrPem.
         * @member {string} csrPem
         * @memberof lukuid.HeartbeatInitResponse
         * @instance
         */
        HeartbeatInitResponse.prototype.csrPem = "";

        /**
         * HeartbeatInitResponse attestationB64.
         * @member {string} attestationB64
         * @memberof lukuid.HeartbeatInitResponse
         * @instance
         */
        HeartbeatInitResponse.prototype.attestationB64 = "";

        /**
         * HeartbeatInitResponse counter.
         * @member {number|Long} counter
         * @memberof lukuid.HeartbeatInitResponse
         * @instance
         */
        HeartbeatInitResponse.prototype.counter = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * HeartbeatInitResponse lastSyncBucket.
         * @member {number|Long} lastSyncBucket
         * @memberof lukuid.HeartbeatInitResponse
         * @instance
         */
        HeartbeatInitResponse.prototype.lastSyncBucket = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * HeartbeatInitResponse latestTimestamp.
         * @member {number|Long} latestTimestamp
         * @memberof lukuid.HeartbeatInitResponse
         * @instance
         */
        HeartbeatInitResponse.prototype.latestTimestamp = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * HeartbeatInitResponse currentTimestamp.
         * @member {number|Long} currentTimestamp
         * @memberof lukuid.HeartbeatInitResponse
         * @instance
         */
        HeartbeatInitResponse.prototype.currentTimestamp = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * HeartbeatInitResponse lastIntermediateSerial.
         * @member {string} lastIntermediateSerial
         * @memberof lukuid.HeartbeatInitResponse
         * @instance
         */
        HeartbeatInitResponse.prototype.lastIntermediateSerial = "";

        /**
         * HeartbeatInitResponse lastSlacSerial.
         * @member {string} lastSlacSerial
         * @memberof lukuid.HeartbeatInitResponse
         * @instance
         */
        HeartbeatInitResponse.prototype.lastSlacSerial = "";

        /**
         * Creates a new HeartbeatInitResponse instance using the specified properties.
         * @function create
         * @memberof lukuid.HeartbeatInitResponse
         * @static
         * @param {lukuid.IHeartbeatInitResponse=} [properties] Properties to set
         * @returns {lukuid.HeartbeatInitResponse} HeartbeatInitResponse instance
         */
        HeartbeatInitResponse.create = function create(properties) {
            return new HeartbeatInitResponse(properties);
        };

        /**
         * Encodes the specified HeartbeatInitResponse message. Does not implicitly {@link lukuid.HeartbeatInitResponse.verify|verify} messages.
         * @function encode
         * @memberof lukuid.HeartbeatInitResponse
         * @static
         * @param {lukuid.IHeartbeatInitResponse} message HeartbeatInitResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeartbeatInitResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.signatureB64 != null && Object.hasOwnProperty.call(message, "signatureB64"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.signatureB64);
            if (message.csrPem != null && Object.hasOwnProperty.call(message, "csrPem"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.csrPem);
            if (message.attestationB64 != null && Object.hasOwnProperty.call(message, "attestationB64"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.attestationB64);
            if (message.counter != null && Object.hasOwnProperty.call(message, "counter"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.counter);
            if (message.lastSyncBucket != null && Object.hasOwnProperty.call(message, "lastSyncBucket"))
                writer.uint32(/* id 5, wireType 0 =*/40).int64(message.lastSyncBucket);
            if (message.latestTimestamp != null && Object.hasOwnProperty.call(message, "latestTimestamp"))
                writer.uint32(/* id 6, wireType 0 =*/48).int64(message.latestTimestamp);
            if (message.currentTimestamp != null && Object.hasOwnProperty.call(message, "currentTimestamp"))
                writer.uint32(/* id 7, wireType 0 =*/56).int64(message.currentTimestamp);
            if (message.lastIntermediateSerial != null && Object.hasOwnProperty.call(message, "lastIntermediateSerial"))
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.lastIntermediateSerial);
            if (message.lastSlacSerial != null && Object.hasOwnProperty.call(message, "lastSlacSerial"))
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.lastSlacSerial);
            return writer;
        };

        /**
         * Encodes the specified HeartbeatInitResponse message, length delimited. Does not implicitly {@link lukuid.HeartbeatInitResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.HeartbeatInitResponse
         * @static
         * @param {lukuid.IHeartbeatInitResponse} message HeartbeatInitResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeartbeatInitResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a HeartbeatInitResponse message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.HeartbeatInitResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.HeartbeatInitResponse} HeartbeatInitResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeartbeatInitResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.HeartbeatInitResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.signatureB64 = reader.string();
                        break;
                    }
                case 2: {
                        message.csrPem = reader.string();
                        break;
                    }
                case 3: {
                        message.attestationB64 = reader.string();
                        break;
                    }
                case 4: {
                        message.counter = reader.uint64();
                        break;
                    }
                case 5: {
                        message.lastSyncBucket = reader.int64();
                        break;
                    }
                case 6: {
                        message.latestTimestamp = reader.int64();
                        break;
                    }
                case 7: {
                        message.currentTimestamp = reader.int64();
                        break;
                    }
                case 8: {
                        message.lastIntermediateSerial = reader.string();
                        break;
                    }
                case 9: {
                        message.lastSlacSerial = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a HeartbeatInitResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.HeartbeatInitResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.HeartbeatInitResponse} HeartbeatInitResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeartbeatInitResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a HeartbeatInitResponse message.
         * @function verify
         * @memberof lukuid.HeartbeatInitResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        HeartbeatInitResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.signatureB64 != null && message.hasOwnProperty("signatureB64"))
                if (!$util.isString(message.signatureB64))
                    return "signatureB64: string expected";
            if (message.csrPem != null && message.hasOwnProperty("csrPem"))
                if (!$util.isString(message.csrPem))
                    return "csrPem: string expected";
            if (message.attestationB64 != null && message.hasOwnProperty("attestationB64"))
                if (!$util.isString(message.attestationB64))
                    return "attestationB64: string expected";
            if (message.counter != null && message.hasOwnProperty("counter"))
                if (!$util.isInteger(message.counter) && !(message.counter && $util.isInteger(message.counter.low) && $util.isInteger(message.counter.high)))
                    return "counter: integer|Long expected";
            if (message.lastSyncBucket != null && message.hasOwnProperty("lastSyncBucket"))
                if (!$util.isInteger(message.lastSyncBucket) && !(message.lastSyncBucket && $util.isInteger(message.lastSyncBucket.low) && $util.isInteger(message.lastSyncBucket.high)))
                    return "lastSyncBucket: integer|Long expected";
            if (message.latestTimestamp != null && message.hasOwnProperty("latestTimestamp"))
                if (!$util.isInteger(message.latestTimestamp) && !(message.latestTimestamp && $util.isInteger(message.latestTimestamp.low) && $util.isInteger(message.latestTimestamp.high)))
                    return "latestTimestamp: integer|Long expected";
            if (message.currentTimestamp != null && message.hasOwnProperty("currentTimestamp"))
                if (!$util.isInteger(message.currentTimestamp) && !(message.currentTimestamp && $util.isInteger(message.currentTimestamp.low) && $util.isInteger(message.currentTimestamp.high)))
                    return "currentTimestamp: integer|Long expected";
            if (message.lastIntermediateSerial != null && message.hasOwnProperty("lastIntermediateSerial"))
                if (!$util.isString(message.lastIntermediateSerial))
                    return "lastIntermediateSerial: string expected";
            if (message.lastSlacSerial != null && message.hasOwnProperty("lastSlacSerial"))
                if (!$util.isString(message.lastSlacSerial))
                    return "lastSlacSerial: string expected";
            return null;
        };

        /**
         * Creates a HeartbeatInitResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.HeartbeatInitResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.HeartbeatInitResponse} HeartbeatInitResponse
         */
        HeartbeatInitResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.HeartbeatInitResponse)
                return object;
            let message = new $root.lukuid.HeartbeatInitResponse();
            if (object.signatureB64 != null)
                message.signatureB64 = String(object.signatureB64);
            if (object.csrPem != null)
                message.csrPem = String(object.csrPem);
            if (object.attestationB64 != null)
                message.attestationB64 = String(object.attestationB64);
            if (object.counter != null)
                if ($util.Long)
                    (message.counter = $util.Long.fromValue(object.counter)).unsigned = true;
                else if (typeof object.counter === "string")
                    message.counter = parseInt(object.counter, 10);
                else if (typeof object.counter === "number")
                    message.counter = object.counter;
                else if (typeof object.counter === "object")
                    message.counter = new $util.LongBits(object.counter.low >>> 0, object.counter.high >>> 0).toNumber(true);
            if (object.lastSyncBucket != null)
                if ($util.Long)
                    (message.lastSyncBucket = $util.Long.fromValue(object.lastSyncBucket)).unsigned = false;
                else if (typeof object.lastSyncBucket === "string")
                    message.lastSyncBucket = parseInt(object.lastSyncBucket, 10);
                else if (typeof object.lastSyncBucket === "number")
                    message.lastSyncBucket = object.lastSyncBucket;
                else if (typeof object.lastSyncBucket === "object")
                    message.lastSyncBucket = new $util.LongBits(object.lastSyncBucket.low >>> 0, object.lastSyncBucket.high >>> 0).toNumber();
            if (object.latestTimestamp != null)
                if ($util.Long)
                    (message.latestTimestamp = $util.Long.fromValue(object.latestTimestamp)).unsigned = false;
                else if (typeof object.latestTimestamp === "string")
                    message.latestTimestamp = parseInt(object.latestTimestamp, 10);
                else if (typeof object.latestTimestamp === "number")
                    message.latestTimestamp = object.latestTimestamp;
                else if (typeof object.latestTimestamp === "object")
                    message.latestTimestamp = new $util.LongBits(object.latestTimestamp.low >>> 0, object.latestTimestamp.high >>> 0).toNumber();
            if (object.currentTimestamp != null)
                if ($util.Long)
                    (message.currentTimestamp = $util.Long.fromValue(object.currentTimestamp)).unsigned = false;
                else if (typeof object.currentTimestamp === "string")
                    message.currentTimestamp = parseInt(object.currentTimestamp, 10);
                else if (typeof object.currentTimestamp === "number")
                    message.currentTimestamp = object.currentTimestamp;
                else if (typeof object.currentTimestamp === "object")
                    message.currentTimestamp = new $util.LongBits(object.currentTimestamp.low >>> 0, object.currentTimestamp.high >>> 0).toNumber();
            if (object.lastIntermediateSerial != null)
                message.lastIntermediateSerial = String(object.lastIntermediateSerial);
            if (object.lastSlacSerial != null)
                message.lastSlacSerial = String(object.lastSlacSerial);
            return message;
        };

        /**
         * Creates a plain object from a HeartbeatInitResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.HeartbeatInitResponse
         * @static
         * @param {lukuid.HeartbeatInitResponse} message HeartbeatInitResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        HeartbeatInitResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.signatureB64 = "";
                object.csrPem = "";
                object.attestationB64 = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.counter = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.counter = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.lastSyncBucket = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.lastSyncBucket = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.latestTimestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.latestTimestamp = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.currentTimestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.currentTimestamp = options.longs === String ? "0" : 0;
                object.lastIntermediateSerial = "";
                object.lastSlacSerial = "";
            }
            if (message.signatureB64 != null && message.hasOwnProperty("signatureB64"))
                object.signatureB64 = message.signatureB64;
            if (message.csrPem != null && message.hasOwnProperty("csrPem"))
                object.csrPem = message.csrPem;
            if (message.attestationB64 != null && message.hasOwnProperty("attestationB64"))
                object.attestationB64 = message.attestationB64;
            if (message.counter != null && message.hasOwnProperty("counter"))
                if (typeof message.counter === "number")
                    object.counter = options.longs === String ? String(message.counter) : message.counter;
                else
                    object.counter = options.longs === String ? $util.Long.prototype.toString.call(message.counter) : options.longs === Number ? new $util.LongBits(message.counter.low >>> 0, message.counter.high >>> 0).toNumber(true) : message.counter;
            if (message.lastSyncBucket != null && message.hasOwnProperty("lastSyncBucket"))
                if (typeof message.lastSyncBucket === "number")
                    object.lastSyncBucket = options.longs === String ? String(message.lastSyncBucket) : message.lastSyncBucket;
                else
                    object.lastSyncBucket = options.longs === String ? $util.Long.prototype.toString.call(message.lastSyncBucket) : options.longs === Number ? new $util.LongBits(message.lastSyncBucket.low >>> 0, message.lastSyncBucket.high >>> 0).toNumber() : message.lastSyncBucket;
            if (message.latestTimestamp != null && message.hasOwnProperty("latestTimestamp"))
                if (typeof message.latestTimestamp === "number")
                    object.latestTimestamp = options.longs === String ? String(message.latestTimestamp) : message.latestTimestamp;
                else
                    object.latestTimestamp = options.longs === String ? $util.Long.prototype.toString.call(message.latestTimestamp) : options.longs === Number ? new $util.LongBits(message.latestTimestamp.low >>> 0, message.latestTimestamp.high >>> 0).toNumber() : message.latestTimestamp;
            if (message.currentTimestamp != null && message.hasOwnProperty("currentTimestamp"))
                if (typeof message.currentTimestamp === "number")
                    object.currentTimestamp = options.longs === String ? String(message.currentTimestamp) : message.currentTimestamp;
                else
                    object.currentTimestamp = options.longs === String ? $util.Long.prototype.toString.call(message.currentTimestamp) : options.longs === Number ? new $util.LongBits(message.currentTimestamp.low >>> 0, message.currentTimestamp.high >>> 0).toNumber() : message.currentTimestamp;
            if (message.lastIntermediateSerial != null && message.hasOwnProperty("lastIntermediateSerial"))
                object.lastIntermediateSerial = message.lastIntermediateSerial;
            if (message.lastSlacSerial != null && message.hasOwnProperty("lastSlacSerial"))
                object.lastSlacSerial = message.lastSlacSerial;
            return object;
        };

        /**
         * Converts this HeartbeatInitResponse to JSON.
         * @function toJSON
         * @memberof lukuid.HeartbeatInitResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        HeartbeatInitResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for HeartbeatInitResponse
         * @function getTypeUrl
         * @memberof lukuid.HeartbeatInitResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        HeartbeatInitResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.HeartbeatInitResponse";
        };

        return HeartbeatInitResponse;
    })();

    lukuid.CommandResponse = (function() {

        /**
         * Properties of a CommandResponse.
         * @memberof lukuid
         * @interface ICommandResponse
         * @property {string|null} [action] CommandResponse action
         * @property {lukuid.Status|null} [status] CommandResponse status
         * @property {boolean|null} [success] CommandResponse success
         * @property {string|null} [errorCode] CommandResponse errorCode
         * @property {string|null} [message] CommandResponse message
         * @property {lukuid.IDeviceInfoResponse|null} [deviceInfo] CommandResponse deviceInfo
         * @property {lukuid.INetworkConfigResponse|null} [networkConfig] CommandResponse networkConfig
         * @property {lukuid.IScanRecord|null} [scanRecord] CommandResponse scanRecord
         * @property {lukuid.IEnvironmentRecord|null} [envRecord] CommandResponse envRecord
         * @property {lukuid.IFetchResponse|null} [fetchResponse] CommandResponse fetchResponse
         * @property {lukuid.IFullRecordResponse|null} [fullRecordResponse] CommandResponse fullRecordResponse
         * @property {lukuid.IRecordBatches|null} [recordBatches] CommandResponse recordBatches
         * @property {lukuid.IHeartbeatInitResponse|null} [heartbeatInit] CommandResponse heartbeatInit
         * @property {lukuid.IStatusResponse|null} [statusResponse] CommandResponse statusResponse
         * @property {lukuid.IFetchTelemetryResponse|null} [fetchTelemetry] CommandResponse fetchTelemetry
         * @property {Uint8Array|null} [signature] CommandResponse signature
         * @property {Uint8Array|null} [key] CommandResponse key
         * @property {boolean|null} [hasMore] CommandResponse hasMore
         */

        /**
         * Constructs a new CommandResponse.
         * @memberof lukuid
         * @classdesc Represents a CommandResponse.
         * @implements ICommandResponse
         * @constructor
         * @param {lukuid.ICommandResponse=} [properties] Properties to set
         */
        function CommandResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * CommandResponse action.
         * @member {string} action
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.action = "";

        /**
         * CommandResponse status.
         * @member {lukuid.Status} status
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.status = 0;

        /**
         * CommandResponse success.
         * @member {boolean} success
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.success = false;

        /**
         * CommandResponse errorCode.
         * @member {string} errorCode
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.errorCode = "";

        /**
         * CommandResponse message.
         * @member {string} message
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.message = "";

        /**
         * CommandResponse deviceInfo.
         * @member {lukuid.IDeviceInfoResponse|null|undefined} deviceInfo
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.deviceInfo = null;

        /**
         * CommandResponse networkConfig.
         * @member {lukuid.INetworkConfigResponse|null|undefined} networkConfig
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.networkConfig = null;

        /**
         * CommandResponse scanRecord.
         * @member {lukuid.IScanRecord|null|undefined} scanRecord
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.scanRecord = null;

        /**
         * CommandResponse envRecord.
         * @member {lukuid.IEnvironmentRecord|null|undefined} envRecord
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.envRecord = null;

        /**
         * CommandResponse fetchResponse.
         * @member {lukuid.IFetchResponse|null|undefined} fetchResponse
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.fetchResponse = null;

        /**
         * CommandResponse fullRecordResponse.
         * @member {lukuid.IFullRecordResponse|null|undefined} fullRecordResponse
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.fullRecordResponse = null;

        /**
         * CommandResponse recordBatches.
         * @member {lukuid.IRecordBatches|null|undefined} recordBatches
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.recordBatches = null;

        /**
         * CommandResponse heartbeatInit.
         * @member {lukuid.IHeartbeatInitResponse|null|undefined} heartbeatInit
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.heartbeatInit = null;

        /**
         * CommandResponse statusResponse.
         * @member {lukuid.IStatusResponse|null|undefined} statusResponse
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.statusResponse = null;

        /**
         * CommandResponse fetchTelemetry.
         * @member {lukuid.IFetchTelemetryResponse|null|undefined} fetchTelemetry
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.fetchTelemetry = null;

        /**
         * CommandResponse signature.
         * @member {Uint8Array|null|undefined} signature
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.signature = null;

        /**
         * CommandResponse key.
         * @member {Uint8Array|null|undefined} key
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.key = null;

        /**
         * CommandResponse hasMore.
         * @member {boolean|null|undefined} hasMore
         * @memberof lukuid.CommandResponse
         * @instance
         */
        CommandResponse.prototype.hasMore = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * CommandResponse payload.
         * @member {"deviceInfo"|"networkConfig"|"scanRecord"|"envRecord"|"fetchResponse"|"fullRecordResponse"|"recordBatches"|"heartbeatInit"|"statusResponse"|"fetchTelemetry"|undefined} payload
         * @memberof lukuid.CommandResponse
         * @instance
         */
        Object.defineProperty(CommandResponse.prototype, "payload", {
            get: $util.oneOfGetter($oneOfFields = ["deviceInfo", "networkConfig", "scanRecord", "envRecord", "fetchResponse", "fullRecordResponse", "recordBatches", "heartbeatInit", "statusResponse", "fetchTelemetry"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(CommandResponse.prototype, "_signature", {
            get: $util.oneOfGetter($oneOfFields = ["signature"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(CommandResponse.prototype, "_key", {
            get: $util.oneOfGetter($oneOfFields = ["key"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        // Virtual OneOf for proto3 optional field
        Object.defineProperty(CommandResponse.prototype, "_hasMore", {
            get: $util.oneOfGetter($oneOfFields = ["hasMore"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new CommandResponse instance using the specified properties.
         * @function create
         * @memberof lukuid.CommandResponse
         * @static
         * @param {lukuid.ICommandResponse=} [properties] Properties to set
         * @returns {lukuid.CommandResponse} CommandResponse instance
         */
        CommandResponse.create = function create(properties) {
            return new CommandResponse(properties);
        };

        /**
         * Encodes the specified CommandResponse message. Does not implicitly {@link lukuid.CommandResponse.verify|verify} messages.
         * @function encode
         * @memberof lukuid.CommandResponse
         * @static
         * @param {lukuid.ICommandResponse} message CommandResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CommandResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.action != null && Object.hasOwnProperty.call(message, "action"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.action);
            if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.status);
            if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                writer.uint32(/* id 3, wireType 0 =*/24).bool(message.success);
            if (message.errorCode != null && Object.hasOwnProperty.call(message, "errorCode"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.errorCode);
            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.message);
            if (message.deviceInfo != null && Object.hasOwnProperty.call(message, "deviceInfo"))
                $root.lukuid.DeviceInfoResponse.encode(message.deviceInfo, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.networkConfig != null && Object.hasOwnProperty.call(message, "networkConfig"))
                $root.lukuid.NetworkConfigResponse.encode(message.networkConfig, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            if (message.scanRecord != null && Object.hasOwnProperty.call(message, "scanRecord"))
                $root.lukuid.ScanRecord.encode(message.scanRecord, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
            if (message.envRecord != null && Object.hasOwnProperty.call(message, "envRecord"))
                $root.lukuid.EnvironmentRecord.encode(message.envRecord, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
            if (message.fetchResponse != null && Object.hasOwnProperty.call(message, "fetchResponse"))
                $root.lukuid.FetchResponse.encode(message.fetchResponse, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
            if (message.fullRecordResponse != null && Object.hasOwnProperty.call(message, "fullRecordResponse"))
                $root.lukuid.FullRecordResponse.encode(message.fullRecordResponse, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
            if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
                writer.uint32(/* id 12, wireType 2 =*/98).bytes(message.signature);
            if (message.key != null && Object.hasOwnProperty.call(message, "key"))
                writer.uint32(/* id 13, wireType 2 =*/106).bytes(message.key);
            if (message.heartbeatInit != null && Object.hasOwnProperty.call(message, "heartbeatInit"))
                $root.lukuid.HeartbeatInitResponse.encode(message.heartbeatInit, writer.uint32(/* id 14, wireType 2 =*/114).fork()).ldelim();
            if (message.recordBatches != null && Object.hasOwnProperty.call(message, "recordBatches"))
                $root.lukuid.RecordBatches.encode(message.recordBatches, writer.uint32(/* id 15, wireType 2 =*/122).fork()).ldelim();
            if (message.statusResponse != null && Object.hasOwnProperty.call(message, "statusResponse"))
                $root.lukuid.StatusResponse.encode(message.statusResponse, writer.uint32(/* id 16, wireType 2 =*/130).fork()).ldelim();
            if (message.fetchTelemetry != null && Object.hasOwnProperty.call(message, "fetchTelemetry"))
                $root.lukuid.FetchTelemetryResponse.encode(message.fetchTelemetry, writer.uint32(/* id 17, wireType 2 =*/138).fork()).ldelim();
            if (message.hasMore != null && Object.hasOwnProperty.call(message, "hasMore"))
                writer.uint32(/* id 18, wireType 0 =*/144).bool(message.hasMore);
            return writer;
        };

        /**
         * Encodes the specified CommandResponse message, length delimited. Does not implicitly {@link lukuid.CommandResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof lukuid.CommandResponse
         * @static
         * @param {lukuid.ICommandResponse} message CommandResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CommandResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a CommandResponse message from the specified reader or buffer.
         * @function decode
         * @memberof lukuid.CommandResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {lukuid.CommandResponse} CommandResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CommandResponse.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.lukuid.CommandResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.action = reader.string();
                        break;
                    }
                case 2: {
                        message.status = reader.int32();
                        break;
                    }
                case 3: {
                        message.success = reader.bool();
                        break;
                    }
                case 4: {
                        message.errorCode = reader.string();
                        break;
                    }
                case 5: {
                        message.message = reader.string();
                        break;
                    }
                case 6: {
                        message.deviceInfo = $root.lukuid.DeviceInfoResponse.decode(reader, reader.uint32());
                        break;
                    }
                case 7: {
                        message.networkConfig = $root.lukuid.NetworkConfigResponse.decode(reader, reader.uint32());
                        break;
                    }
                case 8: {
                        message.scanRecord = $root.lukuid.ScanRecord.decode(reader, reader.uint32());
                        break;
                    }
                case 9: {
                        message.envRecord = $root.lukuid.EnvironmentRecord.decode(reader, reader.uint32());
                        break;
                    }
                case 10: {
                        message.fetchResponse = $root.lukuid.FetchResponse.decode(reader, reader.uint32());
                        break;
                    }
                case 11: {
                        message.fullRecordResponse = $root.lukuid.FullRecordResponse.decode(reader, reader.uint32());
                        break;
                    }
                case 15: {
                        message.recordBatches = $root.lukuid.RecordBatches.decode(reader, reader.uint32());
                        break;
                    }
                case 14: {
                        message.heartbeatInit = $root.lukuid.HeartbeatInitResponse.decode(reader, reader.uint32());
                        break;
                    }
                case 16: {
                        message.statusResponse = $root.lukuid.StatusResponse.decode(reader, reader.uint32());
                        break;
                    }
                case 17: {
                        message.fetchTelemetry = $root.lukuid.FetchTelemetryResponse.decode(reader, reader.uint32());
                        break;
                    }
                case 12: {
                        message.signature = reader.bytes();
                        break;
                    }
                case 13: {
                        message.key = reader.bytes();
                        break;
                    }
                case 18: {
                        message.hasMore = reader.bool();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a CommandResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof lukuid.CommandResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {lukuid.CommandResponse} CommandResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CommandResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a CommandResponse message.
         * @function verify
         * @memberof lukuid.CommandResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        CommandResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.action != null && message.hasOwnProperty("action"))
                if (!$util.isString(message.action))
                    return "action: string expected";
            if (message.status != null && message.hasOwnProperty("status"))
                switch (message.status) {
                default:
                    return "status: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                    break;
                }
            if (message.success != null && message.hasOwnProperty("success"))
                if (typeof message.success !== "boolean")
                    return "success: boolean expected";
            if (message.errorCode != null && message.hasOwnProperty("errorCode"))
                if (!$util.isString(message.errorCode))
                    return "errorCode: string expected";
            if (message.message != null && message.hasOwnProperty("message"))
                if (!$util.isString(message.message))
                    return "message: string expected";
            if (message.deviceInfo != null && message.hasOwnProperty("deviceInfo")) {
                properties.payload = 1;
                {
                    let error = $root.lukuid.DeviceInfoResponse.verify(message.deviceInfo);
                    if (error)
                        return "deviceInfo." + error;
                }
            }
            if (message.networkConfig != null && message.hasOwnProperty("networkConfig")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.NetworkConfigResponse.verify(message.networkConfig);
                    if (error)
                        return "networkConfig." + error;
                }
            }
            if (message.scanRecord != null && message.hasOwnProperty("scanRecord")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.ScanRecord.verify(message.scanRecord);
                    if (error)
                        return "scanRecord." + error;
                }
            }
            if (message.envRecord != null && message.hasOwnProperty("envRecord")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.EnvironmentRecord.verify(message.envRecord);
                    if (error)
                        return "envRecord." + error;
                }
            }
            if (message.fetchResponse != null && message.hasOwnProperty("fetchResponse")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.FetchResponse.verify(message.fetchResponse);
                    if (error)
                        return "fetchResponse." + error;
                }
            }
            if (message.fullRecordResponse != null && message.hasOwnProperty("fullRecordResponse")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.FullRecordResponse.verify(message.fullRecordResponse);
                    if (error)
                        return "fullRecordResponse." + error;
                }
            }
            if (message.recordBatches != null && message.hasOwnProperty("recordBatches")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.RecordBatches.verify(message.recordBatches);
                    if (error)
                        return "recordBatches." + error;
                }
            }
            if (message.heartbeatInit != null && message.hasOwnProperty("heartbeatInit")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.HeartbeatInitResponse.verify(message.heartbeatInit);
                    if (error)
                        return "heartbeatInit." + error;
                }
            }
            if (message.statusResponse != null && message.hasOwnProperty("statusResponse")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.StatusResponse.verify(message.statusResponse);
                    if (error)
                        return "statusResponse." + error;
                }
            }
            if (message.fetchTelemetry != null && message.hasOwnProperty("fetchTelemetry")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    let error = $root.lukuid.FetchTelemetryResponse.verify(message.fetchTelemetry);
                    if (error)
                        return "fetchTelemetry." + error;
                }
            }
            if (message.signature != null && message.hasOwnProperty("signature")) {
                properties._signature = 1;
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            }
            if (message.key != null && message.hasOwnProperty("key")) {
                properties._key = 1;
                if (!(message.key && typeof message.key.length === "number" || $util.isString(message.key)))
                    return "key: buffer expected";
            }
            if (message.hasMore != null && message.hasOwnProperty("hasMore")) {
                properties._hasMore = 1;
                if (typeof message.hasMore !== "boolean")
                    return "hasMore: boolean expected";
            }
            return null;
        };

        /**
         * Creates a CommandResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof lukuid.CommandResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {lukuid.CommandResponse} CommandResponse
         */
        CommandResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.lukuid.CommandResponse)
                return object;
            let message = new $root.lukuid.CommandResponse();
            if (object.action != null)
                message.action = String(object.action);
            switch (object.status) {
            default:
                if (typeof object.status === "number") {
                    message.status = object.status;
                    break;
                }
                break;
            case "STATUS_UNKNOWN":
            case 0:
                message.status = 0;
                break;
            case "STATUS_OK":
            case 1:
                message.status = 1;
                break;
            case "STATUS_ERROR":
            case 2:
                message.status = 2;
                break;
            case "STATUS_READY":
            case 3:
                message.status = 3;
                break;
            }
            if (object.success != null)
                message.success = Boolean(object.success);
            if (object.errorCode != null)
                message.errorCode = String(object.errorCode);
            if (object.message != null)
                message.message = String(object.message);
            if (object.deviceInfo != null) {
                if (typeof object.deviceInfo !== "object")
                    throw TypeError(".lukuid.CommandResponse.deviceInfo: object expected");
                message.deviceInfo = $root.lukuid.DeviceInfoResponse.fromObject(object.deviceInfo);
            }
            if (object.networkConfig != null) {
                if (typeof object.networkConfig !== "object")
                    throw TypeError(".lukuid.CommandResponse.networkConfig: object expected");
                message.networkConfig = $root.lukuid.NetworkConfigResponse.fromObject(object.networkConfig);
            }
            if (object.scanRecord != null) {
                if (typeof object.scanRecord !== "object")
                    throw TypeError(".lukuid.CommandResponse.scanRecord: object expected");
                message.scanRecord = $root.lukuid.ScanRecord.fromObject(object.scanRecord);
            }
            if (object.envRecord != null) {
                if (typeof object.envRecord !== "object")
                    throw TypeError(".lukuid.CommandResponse.envRecord: object expected");
                message.envRecord = $root.lukuid.EnvironmentRecord.fromObject(object.envRecord);
            }
            if (object.fetchResponse != null) {
                if (typeof object.fetchResponse !== "object")
                    throw TypeError(".lukuid.CommandResponse.fetchResponse: object expected");
                message.fetchResponse = $root.lukuid.FetchResponse.fromObject(object.fetchResponse);
            }
            if (object.fullRecordResponse != null) {
                if (typeof object.fullRecordResponse !== "object")
                    throw TypeError(".lukuid.CommandResponse.fullRecordResponse: object expected");
                message.fullRecordResponse = $root.lukuid.FullRecordResponse.fromObject(object.fullRecordResponse);
            }
            if (object.recordBatches != null) {
                if (typeof object.recordBatches !== "object")
                    throw TypeError(".lukuid.CommandResponse.recordBatches: object expected");
                message.recordBatches = $root.lukuid.RecordBatches.fromObject(object.recordBatches);
            }
            if (object.heartbeatInit != null) {
                if (typeof object.heartbeatInit !== "object")
                    throw TypeError(".lukuid.CommandResponse.heartbeatInit: object expected");
                message.heartbeatInit = $root.lukuid.HeartbeatInitResponse.fromObject(object.heartbeatInit);
            }
            if (object.statusResponse != null) {
                if (typeof object.statusResponse !== "object")
                    throw TypeError(".lukuid.CommandResponse.statusResponse: object expected");
                message.statusResponse = $root.lukuid.StatusResponse.fromObject(object.statusResponse);
            }
            if (object.fetchTelemetry != null) {
                if (typeof object.fetchTelemetry !== "object")
                    throw TypeError(".lukuid.CommandResponse.fetchTelemetry: object expected");
                message.fetchTelemetry = $root.lukuid.FetchTelemetryResponse.fromObject(object.fetchTelemetry);
            }
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length >= 0)
                    message.signature = object.signature;
            if (object.key != null)
                if (typeof object.key === "string")
                    $util.base64.decode(object.key, message.key = $util.newBuffer($util.base64.length(object.key)), 0);
                else if (object.key.length >= 0)
                    message.key = object.key;
            if (object.hasMore != null)
                message.hasMore = Boolean(object.hasMore);
            return message;
        };

        /**
         * Creates a plain object from a CommandResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof lukuid.CommandResponse
         * @static
         * @param {lukuid.CommandResponse} message CommandResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        CommandResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.action = "";
                object.status = options.enums === String ? "STATUS_UNKNOWN" : 0;
                object.success = false;
                object.errorCode = "";
                object.message = "";
            }
            if (message.action != null && message.hasOwnProperty("action"))
                object.action = message.action;
            if (message.status != null && message.hasOwnProperty("status"))
                object.status = options.enums === String ? $root.lukuid.Status[message.status] === undefined ? message.status : $root.lukuid.Status[message.status] : message.status;
            if (message.success != null && message.hasOwnProperty("success"))
                object.success = message.success;
            if (message.errorCode != null && message.hasOwnProperty("errorCode"))
                object.errorCode = message.errorCode;
            if (message.message != null && message.hasOwnProperty("message"))
                object.message = message.message;
            if (message.deviceInfo != null && message.hasOwnProperty("deviceInfo")) {
                object.deviceInfo = $root.lukuid.DeviceInfoResponse.toObject(message.deviceInfo, options);
                if (options.oneofs)
                    object.payload = "deviceInfo";
            }
            if (message.networkConfig != null && message.hasOwnProperty("networkConfig")) {
                object.networkConfig = $root.lukuid.NetworkConfigResponse.toObject(message.networkConfig, options);
                if (options.oneofs)
                    object.payload = "networkConfig";
            }
            if (message.scanRecord != null && message.hasOwnProperty("scanRecord")) {
                object.scanRecord = $root.lukuid.ScanRecord.toObject(message.scanRecord, options);
                if (options.oneofs)
                    object.payload = "scanRecord";
            }
            if (message.envRecord != null && message.hasOwnProperty("envRecord")) {
                object.envRecord = $root.lukuid.EnvironmentRecord.toObject(message.envRecord, options);
                if (options.oneofs)
                    object.payload = "envRecord";
            }
            if (message.fetchResponse != null && message.hasOwnProperty("fetchResponse")) {
                object.fetchResponse = $root.lukuid.FetchResponse.toObject(message.fetchResponse, options);
                if (options.oneofs)
                    object.payload = "fetchResponse";
            }
            if (message.fullRecordResponse != null && message.hasOwnProperty("fullRecordResponse")) {
                object.fullRecordResponse = $root.lukuid.FullRecordResponse.toObject(message.fullRecordResponse, options);
                if (options.oneofs)
                    object.payload = "fullRecordResponse";
            }
            if (message.signature != null && message.hasOwnProperty("signature")) {
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
                if (options.oneofs)
                    object._signature = "signature";
            }
            if (message.key != null && message.hasOwnProperty("key")) {
                object.key = options.bytes === String ? $util.base64.encode(message.key, 0, message.key.length) : options.bytes === Array ? Array.prototype.slice.call(message.key) : message.key;
                if (options.oneofs)
                    object._key = "key";
            }
            if (message.heartbeatInit != null && message.hasOwnProperty("heartbeatInit")) {
                object.heartbeatInit = $root.lukuid.HeartbeatInitResponse.toObject(message.heartbeatInit, options);
                if (options.oneofs)
                    object.payload = "heartbeatInit";
            }
            if (message.recordBatches != null && message.hasOwnProperty("recordBatches")) {
                object.recordBatches = $root.lukuid.RecordBatches.toObject(message.recordBatches, options);
                if (options.oneofs)
                    object.payload = "recordBatches";
            }
            if (message.statusResponse != null && message.hasOwnProperty("statusResponse")) {
                object.statusResponse = $root.lukuid.StatusResponse.toObject(message.statusResponse, options);
                if (options.oneofs)
                    object.payload = "statusResponse";
            }
            if (message.fetchTelemetry != null && message.hasOwnProperty("fetchTelemetry")) {
                object.fetchTelemetry = $root.lukuid.FetchTelemetryResponse.toObject(message.fetchTelemetry, options);
                if (options.oneofs)
                    object.payload = "fetchTelemetry";
            }
            if (message.hasMore != null && message.hasOwnProperty("hasMore")) {
                object.hasMore = message.hasMore;
                if (options.oneofs)
                    object._hasMore = "hasMore";
            }
            return object;
        };

        /**
         * Converts this CommandResponse to JSON.
         * @function toJSON
         * @memberof lukuid.CommandResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        CommandResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for CommandResponse
         * @function getTypeUrl
         * @memberof lukuid.CommandResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        CommandResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/lukuid.CommandResponse";
        };

        return CommandResponse;
    })();

    return lukuid;
})();

export { $root as default };
