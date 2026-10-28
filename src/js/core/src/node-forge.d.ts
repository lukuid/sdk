// SPDX-License-Identifier: Apache-2.0
declare module 'node-forge' {
  namespace asn1 {
    interface Asn1 { value: Asn1[] | string; tagClass?: number; }

    interface DerBuffer {
      getBytes(): string;
    }

    function toDer(value: Asn1): DerBuffer;
    function fromDer(value: string): Asn1;
  }

  namespace pki {
    interface PublicKey {
      type?: string;
    }

    interface Certificate {
      publicKey: PublicKey;
      validity: {
        notBefore: Date;
        notAfter: Date;
      };
      verify(child: Certificate): boolean;
    }

    function certsFromPem(pem: string): Certificate[];
    function certificateFromPem(pem: string): Certificate;
    function publicKeyToAsn1(key: PublicKey): asn1.Asn1;
    function certificateToAsn1(cert: Certificate): asn1.Asn1;
  }

  interface Forge {
    asn1: typeof asn1;
    pki: typeof pki;
    util: { decode64(value: string): string; encode64(value: string): string };
    md: { sha256: { create(): { update(value: string): void; digest(): { toHex(): string } } } };
  }

  const forge: Forge;
  export { asn1, pki };
  export default forge;
}
