export type Cultura = 'soja' | 'milho' | 'algodao' | 'pecuaria';

export type Passo1Dados = {
  nome: string;
  email: string;
  senha: string;
  cpfCnpj: string;
};

export type Passo2Dados = {
  culturas: Cultura[];
};

export type Passo3Dados = {
  latitude: string;
  longitude: string;
  areaTotal: string;
  arquivoTalhoes?: string;
};

export type Passo4Dados = {
  aceiteTermos: boolean;
  aceitePrivacidade: boolean;
};

export type CadastroDados = Partial<Passo1Dados & Passo2Dados & Passo3Dados & Passo4Dados>;

export type Usuario = {
  nome: string;
  email: string;
  culturas: Cultura[];
  areaTotal?: string;
  /** Id da 1ª fazenda do usuário — necessário para editar a localização. */
  fazendaId?: string;
  /** Coordenada da fazenda — usada nos alertas de clima. */
  latitude?: number;
  longitude?: number;
};
