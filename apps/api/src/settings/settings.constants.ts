export type SystemSettings = {
  officeName: string;
  emailFromName: string;
  emailFromAddress: string;
  wppconnectSession: string;
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  whatsappBodyTemplate: string;
};

export const DEFAULT_SETTINGS: SystemSettings = {
  officeName: "Equipe do escritório",
  emailFromName: "Equipe do escritório",
  emailFromAddress: "contato@example.com",
  wppconnectSession: "default",
  emailSubjectTemplate: "Envio de {documento} - {competencia}",
  emailBodyTemplate:
    "Olá, {nome_cliente}.\n\nSegue em anexo o documento {documento}, referente à competência {competencia}, com vencimento em {vencimento}.\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\n{nome_escritorio}.",
  whatsappBodyTemplate:
    "Olá, {nome_cliente}. Segue em anexo o documento {documento}, referente à competência {competencia}, com vencimento em {vencimento}. Qualquer dúvida, estamos à disposição."
};
