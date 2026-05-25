import { PDFDocument, PDFName, PDFDict, PDFArray, PDFStream } from 'pdf-lib';

export async function extractEvidence(data: Uint8Array): Promise<Uint8Array | null> {
    const doc = await PDFDocument.load(data);
    const catalog = doc.catalog;
    const names = catalog.get(PDFName.of('Names'));
    if (!(names instanceof PDFDict)) return null;
    const embeddedFiles = names.get(PDFName.of('EmbeddedFiles'));
    if (!(embeddedFiles instanceof PDFDict)) return null;
    
    // Simple tree traversal
    const traverseTree = (node: PDFDict): Uint8Array | null => {
        const namesArray = node.get(PDFName.of('Names'));
        if (namesArray instanceof PDFArray) {
            for (let i = 0; i < namesArray.size(); i += 2) {
                // name is at i, spec is at i+1
                const spec = namesArray.lookup(i + 1);
                if (spec instanceof PDFDict) {
                    const ef = spec.lookup(PDFName.of('EF'));
                    if (ef instanceof PDFDict) {
                        const f = ef.lookup(PDFName.of('F'));
                        if (f instanceof PDFStream) {
                            return f.decode();
                        }
                    }
                }
            }
        }
        const kidsArray = node.get(PDFName.of('Kids'));
        if (kidsArray instanceof PDFArray) {
            for (let i = 0; i < kidsArray.size(); i++) {
                const kid = kidsArray.lookup(i);
                if (kid instanceof PDFDict) {
                    const result = traverseTree(kid);
                    if (result) return result;
                }
            }
        }
        return null;
    };
    
    return traverseTree(embeddedFiles);
}
