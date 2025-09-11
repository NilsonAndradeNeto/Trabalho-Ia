import React, { useMemo, useState } from 'react';
import { cancelAnimation, resetAnimationArtifacts } from './animation';
import { Board, parseCasa, solveKnightTour } from './knight_core';

export function App() {
  const [input, setInput] = useState('');
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maskChessNotation = (raw: string) => {
    const s = raw.replace(/\s+/g, '').toUpperCase();
    let out = '';
    for (const ch of s) {
      if (out.length === 0) {
        if (/[A-H]/.test(ch)) out = ch;
      } else if (out.length === 1) {
        if (/[1-8]/.test(ch)) {
          out += ch;
          break; // completa notação, ignora o restante
        }
      }
      if (out.length >= 2) break;
    }
    return out.slice(0, 2);
  };

  const handleSolve = (ev?: React.FormEvent) => {
    ev?.preventDefault();
    // Interrompe animação em andamento, se houver
    cancelAnimation();
    // Limpa destaques e remove o ícone do cavalo
    resetAnimationArtifacts();
    setError(null);
    setBoard(null);
    const parsed = parseCasa(input);
    if (!parsed) {
      setError('Entrada inválida. Exemplos: E4, e4');
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
            onChange={(e) => setInput(maskChessNotation(e.target.value))}
            placeholder="Ex.: E4"
            inputMode="text"
            maxLength={2}
            pattern="[A-Ha-h][1-8]"
            title="Use a notação de xadrez: letra A–H seguida de número 1–8"
          />
        </label>
        <button type="submit">Calcular</button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="content">
        <div className="board-area">
          <div className="ranks">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rank-label">{8 - i}</div>
            ))}
          </div>

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

          <div className="files">
            {Array.from({ length: 8 }).map((_, c) => (
              <div key={c} className="file-label">{String.fromCharCode(65 + c)}</div>
            ))}
          </div>
        </div>

        <div className="steps">
          <h2>Passos</h2>
          {board ? (
            <ol>
              {stepsList.map(({ step, row, col }) => {
                const file = String.fromCharCode(65 + col);
                const rank = 8 - row;
                return (
                  <li key={step}>
                    {step}. ({row + 1}, {col + 1}) — {file}
                    {rank}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p>Informe a casa inicial e clique em Calcular.</p>
          )}
        </div>
      </div>
    </div>
  );
}

