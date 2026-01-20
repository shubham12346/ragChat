import pdfParse from "pdf-parse";

export async function pdfParser(pdfText: Buffer): Promise<string> {
  try {
    console.log("pdfText", pdfText);
    const data = await pdfParse(pdfText);
    console.log("data", data);
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw error;
  }
}
