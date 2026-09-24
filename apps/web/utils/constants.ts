export interface TestCard {
  brand: string;
  number: string;
  cvc: string;
  date: string;
}

export const TEST_CARDS: TestCard[] = [
  {
    brand: "Visa",
    number: "4242 4242 4242 4242",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "Visa (debit)",
    number: "4000 0566 5566 5556",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "Mastercard",
    number: "5555 5555 5555 4444",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "Mastercard (2-series)",
    number: "2223 0031 2200 3222",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "Mastercard (debit)",
    number: "5200 8282 8282 8210",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "Mastercard (prepaid)",
    number: "5105 1051 0510 5100",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "American Express",
    number: "3782 822463 10005",
    cvc: "Any 4 digits",
    date: "Any future date",
  },
  {
    brand: "American Express",
    number: "3714 496353 98431",
    cvc: "Any 4 digits",
    date: "Any future date",
  },
  {
    brand: "Discover",
    number: "6011 1111 1111 1117",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "Discover",
    number: "6011 0009 9013 9424",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "Discover (debit)",
    number: "6011 9811 1111 1113",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "Diners Club",
    number: "3056 9300 0902 0004",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "Diners Club (14-digit card)",
    number: "3622 720627 1667",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "BCard and DinaCard",
    number: "6555 9000 0060 4105",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "JCB",
    number: "3566 0020 2036 0505",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "UnionPay",
    number: "6200 0000 0000 0005",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "UnionPay (debit)",
    number: "6200 0000 0000 0047",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
  {
    brand: "UnionPay (19-digit card)",
    number: "6205 5000 0000 0004",
    cvc: "Any 3 digits",
    date: "Any future date",
  },
];
