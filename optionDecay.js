const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function askNumber(question) {
  let value = Number(await ask(question));

  while (Number.isNaN(value) || value < 0) {
    console.log("Please enter a valid positive number.");
    value = Number(await ask(question));
  }

  return value;
}

async function askOptionType(question) {
  let value = (await ask(question)).toLowerCase();

  while (value !== "call" && value !== "put") {
    console.log("Please enter either call or put.");
    value = (await ask(question)).toLowerCase();
  }

  return value;
}

function cnd(x) {
  const p = 0.2316419;
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;

  const t = 1 / (1 + p * Math.abs(x));
  const normalDensity =
    (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);

  const probability =
    1 -
    normalDensity *
      (b1 * t +
        b2 * t ** 2 +
        b3 * t ** 3 +
        b4 * t ** 4 +
        b5 * t ** 5);

  return x >= 0 ? probability : 1 - probability;
}

function blackScholes(S, K, T, r, sigma, type) {
  const d1 =
    (Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) /
    (sigma * Math.sqrt(T));

  const d2 = d1 - sigma * Math.sqrt(T);

  if (type === "call") {
    return S * cnd(d1) - K * Math.exp(-r * T) * cnd(d2);
  }

  if (type === "put") {
    return K * Math.exp(-r * T) * cnd(-d2) - S * cnd(-d1);
  }

  throw new Error("type must be 'call' or 'put'");
}

function optionDecay(S, K, daysToExpiration, r, sigma, type) {
  const results = [];

  for (let days = daysToExpiration; days >= 0; days--) {
    const T = days / 365;

    let price;

    if (days === 0) {
      if (type === "call") {
        price = Math.max(S - K, 0);
      } else {
        price = Math.max(K - S, 0);
      }
    } else {
      price = blackScholes(S, K, T, r, sigma, type);
    }

    results.push({
      daysLeft: days,
      price: price.toFixed(2),
    });
  }

  return results;
}

async function main() {
  const stockPrice = await askNumber("Stock price: ");
  const strikePrice = await askNumber("Strike price: ");
  const daysToExpiration = await askNumber("Days to expiration: ");

  const interestRatePercent = await askNumber(
    "Interest rate percent, like 5 for 5%: "
  );

  const volatilityPercent = await askNumber(
    "Volatility percent, like 25 for 25%: "
  );

  const optionType = await askOptionType("Option type, call or put: ");

  const interestRate = interestRatePercent / 100;
  const volatility = volatilityPercent / 100;

  const decayTable = optionDecay(
    stockPrice,
    strikePrice,
    daysToExpiration,
    interestRate,
    volatility,
    optionType
  );

  console.table(decayTable);

  console.log(
    `A ${optionType} option with a strike price of $${strikePrice} and ${daysToExpiration} days left starts at about $${decayTable[0].price}.`
  );

  console.log(
    `By expiration, it is worth about $${decayTable[decayTable.length - 1].price}.`
  );

  rl.close();
}

main();