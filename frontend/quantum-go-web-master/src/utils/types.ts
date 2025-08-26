export type Board = Map<string, Chessman>;

export type BoardModel = 9 | 13 | 19;

export type ChessmanType = "black" | "white";

export type Chessman = { position: string, type: ChessmanType, brother: string };

export type ChessmanRecord = { add: Chessman[], reduce: Chessman[] };

export type ChessmanRecords = ChessmanRecord[];

export type Response = { success: boolean, status: number, data: Record<string, any> };