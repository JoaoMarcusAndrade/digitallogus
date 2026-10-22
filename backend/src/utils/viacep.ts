// Novo arquivo (viacep). Consulta CEP via API pública.
// Não fica traduzindo campos vindos da API; normaliza apenas para o formato usado pelo sistema.
import { httpError } from "./auth.js";
import { cacheGet, cacheSet } from "./cache.js";

/** Endereços de CEP mudam com pouca frequência: 30 dias de cache evitam repetir a consulta ao ViaCEP. */
const TTL_CEP_MS = 30 * 24 * 60 * 60 * 1000;

export interface EnderecoViaCep {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoViaCep> {
  const digitos = String(cep || "").replace(/\D/g, "");
  if (digitos.length !== 8) {
    throw httpError("CEP inválido. Informe 8 dígitos.", 400);
  }

  const chaveCache = `cep:${digitos}`;
  const emCache = cacheGet<EnderecoViaCep>(chaveCache, TTL_CEP_MS);
  if (emCache) return emCache;

  const url = `https://viacep.com.br/ws/${digitos}/json/`;
  let resp: Response;
  try {
    resp = await fetch(url);
  } catch (e: any) {
    throw httpError("Não foi possível consultar o CEP.", 502);
  }

  if (!resp.ok) {
    throw httpError("Falha ao consultar o CEP.", 502);
  }

  let dados: any;
  try {
    dados = await resp.json();
  } catch (e: any) {
    throw httpError("Resposta inválida ao consultar o CEP.", 502);
  }

  if (dados?.erro) {
    throw httpError("CEP não encontrado.", 404);
  }

  const endereco: EnderecoViaCep = {
    rua: dados.logradouro || "",
    bairro: dados.bairro || "",
    cidade: dados.localidade || "",
    estado: dados.uf || "",
    cep: digitos
  };

  cacheSet(chaveCache, endereco, TTL_CEP_MS);

  return endereco;
}
