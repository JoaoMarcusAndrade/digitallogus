/* ============================================================
   Alexandria — Hook de carregamento de dados da API
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Executa uma chamada da API e devolve `{ data, loading, erro, reload }`.
 *
 * @param {Function} fetcher  função que devolve a promise da API
 * @param {Array}    deps     dependências que disparam um novo carregamento
 * @param {*}        inicial  valor inicial de `data`
 */
export function useApi(fetcher, deps = [], inicial = null) {
  const [data, setData] = useState(inicial);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [tick, setTick] = useState(0);

  const ref = useRef(fetcher);
  ref.current = fetcher;

  useEffect(() => {
    let ativo = true;
    setLoading(true);

    Promise.resolve()
      .then(() => ref.current())
      .then((resultado) => {
        if (!ativo) return;
        setData(resultado);
        setErro(null);
      })
      .catch((e) => {
        if (!ativo) return;
        setErro(e?.message || 'Não foi possível carregar os dados.');
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, erro, reload };
}

export default useApi;
