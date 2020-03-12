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

// #tag::customtranscoder_interface[]
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
// #end::customtranscoder_interface[]


class RawStringTranscoder {
// #tag::customtranscoder_encode[]
  encode(value) {
    // If its a string, encode it as a UTF8 string.
    if (typeof value === 'string') {
      return [
        Buffer.from(value),
        CF_UTF8 | NF_UTF8
      ];
    }
    const myErr = new Error('encode - InvalidArgumentException');
    console.log("encode is going to throw");
    console.log(myErr);
    throw myErr;
  }
// #end::customtranscoder_encode[]

// #tag::customtranscoder_decode[]
  decode(bytes, flags) {
    var format = flags & NF_MASK;
    var cfformat = flags & CF_MASK;

    if (cfformat === CF_UTF8) {
      format = NF_UTF8;
      return bytes.toString('utf8');
    } 
    const myErr = new Error('decode - InvalidArgumentException');
    console.log("decode is going to throw");
    console.log(myErr);
    throw myErr;
  }
// #end::customtranscoder_decode[]
}
module.exports = RawStringTranscoder;

// #end::customtranscoder_class[]
