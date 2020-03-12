// #tag::customtranscoder_class[]

const NF_JSON = 0x00;
const NF_RAW = 0x02;
const NF_UTF8 = 0x04;
const NF_MASK = 0xFF;
const NF_UNKNOWN = 0x100;

const CF_NONE = 0x00 << 24;
const CF_PRIVATE = 0x01 << 24;
const CF_JSON = 0x02 << 24;
const CF_RAW = 0x03 << 24;
const CF_UTF8 = 0x04 << 24;
const CF_MASK = 0xFF << 24;

/**
 * Transcoder provides an interface for performing custom transcoding
 * of document contents being retrieved and stored to the cluster.
 *
 * @interface
 */
class Transcoder {
  /**
   * @param {*} value
   *
   * @returns {Pair.<Buffer, number>}
   */
  encode(value) {
    throw new Error('not implemented');
  }

  /**
   * @param {Buffer} bytes
   * @param {number} flags
   *
   * @returns {*}
   */
  decode(bytes, flags) {
    throw new Error('not implemented');
  }
}

class RawBinaryTranscoder {
  encode(value) {
    // If its a buffer, write that directly as raw.
    if (Buffer.isBuffer(value)) {
      return [
        value,
        CF_RAW | NF_RAW
      ];
    }

    // If its a string, encode it as a UTF8 string.
    if (typeof value === 'string') {
      return [
        Buffer.from(value),
        CF_UTF8 | NF_UTF8
      ];
    }
    throw new Error("value is not a string");
  }

  decode(bytes, flags) {
    var format = flags & NF_MASK;
    var cfformat = flags & CF_MASK;

    if (cfformat !== 0) {
       if (cfformat === CF_RAW) {
        format = NF_RAW;
      } else if (cfformat === CF_UTF8) {
        format = NF_UTF8;
      } else if (cfformat !== CF_PRIVATE) {
        // Unknown CF Format!  The following will force
        //   fallback to reporting RAW data.
        format = NF_UNKNOWN;
      }
    }

    if (format === NF_UTF8) {
      return bytes.toString('utf8');
    } else if (format === NF_RAW) {
      return bytes;
    } 

    // Default to returning a Buffer if all else fails.
    return bytes;
  }
}
module.exports = RawBinaryTranscoder;

// #end::customtranscoder_class[]
