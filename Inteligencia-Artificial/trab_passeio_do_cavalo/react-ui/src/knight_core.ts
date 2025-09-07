const dx = [+2, +1, -1, -2, -2, -1, +1, +2];
const dy = [+1, +2, +2, +1, -1, -2, -2, -1];
export type Board = number[][];

const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

function degree(board: Board, r: number, c: number): number {
  let cnt = 0;
  for (let k = 0; k < 8; k++) {
    const nr = r + dx[k], nc = c + dy[k];
    if (inside(nr, nc) && board[nr][nc] === 0) cnt++;
  }
  return cnt;
}

function orderedMoves(board: Board, r: number, c: number): Array<[number, number]> {
  const moves: Array<[number, number]> = [];
  for (let k = 0; k < 8; k++) {
    const nr = r + dx[k], nc = c + dy[k];
    if (inside(nr, nc) && board[nr][nc] === 0) moves.push([nr, nc]);
  }
  moves.sort((a, b) => {
    const da = degree(board, a[0], a[1]);
    const db = degree(board, b[0], b[1]);
    if (da !== db) return da - db;
    const dist2 = (rr: number, cc: number) => (rr - 3) ** 2 + (cc - 3) ** 2;
    return dist2(a[0], a[1]) - dist2(b[0], b[1]);
  });
  return moves;
}

function dfs(r: number, c: number, step: number, board: Board): boolean {
  if (step === 64) return true;
  for (const [nr, nc] of orderedMoves(board, r, c)) {
    board[nr][nc] = step + 1;
    if (dfs(nr, nc, step + 1, board)) return true;
    board[nr][nc] = 0;
  }
  return false;
}

export function parseCasa(s: string): { row: number; col: number } | null {
  const t = s.replace(/\s+/g, '');
  if (t.length === 2 && /[A-Za-z]/.test(t[0]) && /[1-8]/.test(t[1])) {
    const col = t[0].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
    const row = Number(t[1]) - 1;
    if (col >= 0 && col < 8 && row >= 0 && row < 8) return { row, col };
  }
  const nums = s.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 2) {
    const [a, b] = nums;
    if (a >= 1 && a <= 8 && b >= 1 && b <= 8) return { row: a - 1, col: b - 1 };
  }
  return null;
}

export function solveKnightTour(row: number, col: number): Board | null {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(0));
  board[row][col] = 1;
  if (!dfs(row, col, 1, board)) return null;
  return board;
}

