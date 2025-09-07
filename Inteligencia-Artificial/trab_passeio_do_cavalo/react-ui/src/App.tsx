import React, { useMemo, useState } from 'react';
import { parseCasa, solveKnightTour, Board } from './knight_core';

export function App() {
  const [input, setInput] = useState('E4');
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSolve = (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setError(null);
    setBoard(null);
    const parsed = parseCasa(input);
    if (!parsed) {
      setError('Entrada inválida. Exemplos: E4, e4, 4 5, 5 4');
      return;
    }
    const res = solveKnightTour(parsed.row, parsed.col);
    if (!res) {
      setError('Não foi possível encontrar um passeio.');
      return;
    }
    setBoard(res);
  };

  const stepsList = useMemo(() => {
    if (!board) return [] as Array<{ step: number; row: number; col: number }>;
    const coords: Array<{ step: number; row: number; col: number }> = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const step = board[r][c];
        coords.push({ step, row: r, col: c });
      }
    }
    coords.sort((a, b) => a.step - b.step);
    return coords;
  }, [board]);

  return (
    <div className="container">
      <h1>Passeio do Cavalo 8x8</h1>
      <form className="controls" onSubmit={handleSolve}>
        <label>
          Casa inicial:
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex.: E4 ou 4 5"
          />
        </label>
        <button type="submit">Calcular</button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="content">
        <div className="board">
          {Array.from({ length: 8 }).map((_, r) => (
            <div className="row" key={r}>
              {Array.from({ length: 8 }).map((__, c) => {
                const v = board?.[r]?.[c] ?? 0;
                const dark = (r + c) % 2 === 1;
                return (
                  <div key={c} className={"cell " + (dark ? 'dark' : 'light')}>
                    {v > 0 ? String(v).padStart(2, '0') : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="steps">
          <h2>Passos</h2>
          {board ? (
            <ol>
              {stepsList.map(({ step, row, col }) => (
                <li key={step}>
                  {step}. ({row + 1}, {col + 1}) — {String.fromCharCode(65 + col)}
                  {row + 1}
                </li>
              ))}
            </ol>
          ) : (
            <p>Informe a casa inicial e clique em Calcular.</p>
          )}
        </div>
      </div>
    </div>
  );
}

