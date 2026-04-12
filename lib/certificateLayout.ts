/** jsPDF certificate canvas — preview and stored name_x/name_y use this coordinate space */
export const CERTIFICATE_CANVAS_WIDTH = 800;
export const CERTIFICATE_CANVAS_HEIGHT = 600;

export interface CertificatePublicView {
  recipientName: string;
  recipientEmail: string;
  issuedAt: string | null;
  eventTitle: string;
  eventStartAt: string | null;
  templateName: string;
  backgroundImage: string;
  namePlaced: {
    x: number;
    y: number;
    fontSize: number;
    fontColor: string;
  };
  ledgerAnchored: boolean;
  ledgerPreview?: {
    blockIndex: number;
    blockHashShort: string;
    certificateHashShort: string;
  };
}
