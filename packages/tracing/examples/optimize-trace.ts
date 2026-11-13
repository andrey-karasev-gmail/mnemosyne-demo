import { optimize, type OptimizeInput } from "../../domain/src/optimize";

const input = JSON.parse(process.env.MNEMOSYNE_OPTIMIZE_INPUT ?? "{}") as OptimizeInput;
console.log(optimize(input));
