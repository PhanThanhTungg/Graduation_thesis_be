import mimeTypes from 'mime-types';

const fileUtils = {
  getMimeType(fileName: string): string {
    const mimeType = mimeTypes.lookup(fileName);
    return mimeType || 'application/octet-stream';
  },

  async fetchFileAsBase64(fileUrl: string): Promise<string> {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from ${fileUrl}: ${response.statusText}`,
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  },
};

export default fileUtils;
