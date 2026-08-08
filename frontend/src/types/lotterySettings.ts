export interface LotterySettings {
  enable2D: boolean;
  enable3D: boolean;

  twoD: {
    enabled: boolean;
    numberLength: number;
    minBet: number;
    maxBet: number;
    maxNumberLimit: number;
    allowDuplicateNumbers: boolean;
  };

  threeD: {
    enabled: boolean;
    numberLength: number;
    minBet: number;
    maxBet: number;
    maxNumberLimit: number;
    allowDuplicateNumbers: boolean;
  };

  draw: {
    enable2DDraw: boolean;
    enable3DDraw: boolean;
    twoDDrawTime: string;
    threeDDrawTime: string;
    ticketClosingTime2D: string;
    ticketClosingTime3D: string;
    manualResultEntry: boolean;
    resultPublishing: boolean;
  };

  blockedNumbers: string[];
}
