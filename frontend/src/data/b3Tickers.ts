// B3 tickers list for ranking — mirrors DEFAULT_TICKERS from ranking.html

export const B3_TICKERS: string[] = [
  // Bancos & holding financeira
  'ITUB4', 'ITUB3', 'BBDC4', 'BBDC3', 'BBAS3', 'SANB11', 'BRSR6', 'BMGB4', 'BPAC11', 'ABCB4', 'ITSA4',
  // Seguros
  'BBSE3', 'PSSA3', 'CXSE3', 'WIZC3', 'IRBR3', 'SULA11', 'BRBI11',
  // Outros financeiros
  'B3SA3', 'CIEL3', 'RIAA3', 'BRAP4', 'GGPS3',
  // Energia elétrica
  'EGIE3', 'TAEE11', 'TRPL4', 'EQTL3', 'CMIG4', 'CMIG3', 'CPFE3', 'ELET3', 'ELET6', 'CPLE6',
  'ENEV3', 'ENBR3', 'ISAE4', 'AURE3', 'ALUP11', 'ENGI11', 'NEOE3', 'CESP6', 'EQPA3',
  // Gás
  'CGAS3',
  // Saneamento
  'SBSP3', 'SAPR11', 'CSMG3',
  // Petróleo & gás
  'PETR4', 'PETR3', 'PRIO3', 'CSAN3', 'RECV3', 'RRRP3', 'VBBR3', 'RAIZ4', 'BRAV3',
  // Mineração & siderurgia
  'VALE3', 'GGBR4', 'GGBR3', 'CSNA3', 'CMIN3', 'GOAU4', 'USIM5', 'BRKM5', 'CBAV3',
  // Papel & celulose
  'SUZB3', 'KLBN11',
  // Consumo básico
  'ABEV3', 'MDIA3', 'SMTO3', 'BEEF3', 'SLCE3', 'AGRO3', 'TTEN3', 'CAML3', 'NATU3',
  // Consumo cíclico
  'RADL3', 'RENT3', 'LREN3', 'SOMA3', 'ARZZ3', 'VIVA3', 'GRND3', 'CGRA4',
  'NTCO3', 'MGLU3', 'PETZ3', 'CRFB3', 'ASAI3', 'PCAR3', 'SMFT3',
  'ALPA4', 'AZZA3', 'CEAB3', 'LJQQ3',
  // Proteína animal
  'JBSS3', 'BRFS3', 'MRFG3',
  // Construção civil
  'CYRE3', 'MRVE3', 'DIRR3', 'EVEN3', 'CURY3', 'PLPL3', 'TRIS3', 'TEND3',
  'LAVV3', 'JHSF3', 'HBOR3', 'GFSA3', 'MDNE3', 'EZTC3', 'MTRE3',
  // Saúde & farmácia
  'RDOR3', 'FLRY3', 'HAPV3', 'ODPV3', 'HYPE3', 'DASA3', 'QUAL3', 'PNVL3', 'ONCO3', 'PARD3', 'BLAU3',
  // Tecnologia & serviços
  'TOTS3', 'VIVT3', 'TIMS3', 'LWSA3', 'POSI3', 'DESK3', 'VLID3',
  // Industrial
  'WEGE3', 'RAIL3', 'EMBR3', 'TUPY3', 'FRAS3', 'ROMI3', 'MYPK3', 'LEVE3', 'VULC3', 'SHUL4', 'KEPL3',
  'POMO4', 'DXCO3', 'RAPT4',
  // Locação & distribuição
  'UGPA3', 'MOVI3', 'VAMO3', 'ARML3',
  // Shoppings & imóveis
  'MULT3', 'IGTI11', 'ALOS3', 'LOGG3', 'BRPR3',
  // Educação
  'COGN3', 'YDUQ3', 'SEER3', 'ANIM3', 'VTRU3',
  // Transporte & logística
  'GOLL4', 'AZUL4', 'CCRO3', 'ECOR3', 'JSLG3', 'SIMH3', 'HBSA3', 'SEQL3', 'TGMA3', 'LOGN3',
  // Ambiental
  'AMBP3', 'ORVR3',
  // Agro
  'RANI3', 'JALL3', 'SOJA3', 'VITT3',
  // Química
  'UNIP6',
  // Turismo
  'CVCB3',
]

export const SECTOR_PT: Record<string, string> = {
  'Financial Services': 'Financeiro',
  'Utilities': 'Energia',
  'Energy': 'Petróleo & Gás',
  'Basic Materials': 'Mat. Básicos',
  'Consumer Defensive': 'Consumo Básico',
  'Consumer Cyclical': 'Consumo Cíclico',
  'Healthcare': 'Saúde',
  'Technology': 'Tecnologia',
  'Industrials': 'Industrial',
  'Communication Services': 'Comunicação',
  'Real Estate': 'Imóveis',
}
