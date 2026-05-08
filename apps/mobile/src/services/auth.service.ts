import { CadastroDados, Usuario } from '@/screens/auth/cadastro/types';

type LoginPayload = {
  email: string;
  senha: string;
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

export async function cadastrarUsuario(dados: CadastroDados): Promise<Usuario> {
  await wait(450);

  return {
    nome: dados.nome ?? 'Produtor',
    email: dados.email ?? '',
    culturas: dados.culturas ?? [],
    areaTotal: dados.areaTotal,
  };
}

export async function login({ email }: LoginPayload): Promise<Usuario> {
  await wait(350);

  return {
    nome: 'Produtor AgroSolution',
    email,
    culturas: ['soja', 'milho'],
    areaTotal: '500',
  };
}
