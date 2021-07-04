import React, { useState, useEffect } from "react";
import {ConditionalVolume} from "./use_local_volumes";
import {Bodystat} from './day'

const roundToOneDecimalPoint = (x: number) => Number(x.toFixed(1));

const wilks = (x: number, W: number, isMale: boolean) => {
  let a: number, b: number, c: number, d: number, e: number, f: number;
  if (isMale) {
    a = -216.0475144;
    b = 16.2606339;
    c = -0.002388645;
    d = -0.00113732;
    e = 7.01863e-6;
    f = -1.291e-8;
  } else {
    a = 594.31747775582;
    b = -27.23842536447;
    c = 0.82112226871;
    d = -0.00930733913;
    e = 4.731582e-5;
    f = -9.054e-8;
  }
  return W / (a + b * x + c * Math.pow(x, 2) + d * Math.pow(x, 3) + e * Math.pow(x, 4) + f * Math.pow(x, 5));
};

type predictions = {
  oneRepMax: number;
  percentile: number;
};

const eliteStrengthBaselines = [
  235,
  344,
  307,
  154,
  21,
  106,
  122,
  66,
  233,
  205,
  67,
  84,
  200,
  210,
  601,
  32,
  154,
  353,
  186,
  95,
  19,
  514,
  49,
  115,
  173,
  209,
  294,
  399,
  369,
  200,
  251,
  203,
  185,
  236,
  167,
  371,
  422,
  588,
  256,
  65,
  201,
  138,
  133,
  218,
  72,
  207,
  206,
  91,
  228,
  79,
  159,
  179,
  124,
  116,
  430,
  133,
  177,
  62,
  91,
  219,
  118,
  12,
  62,
  222,
  260,
  101,
  85,
  353,
  69,
  433,
  197,
  233,
  270,
  187,
  298,
  80,
  74,
  211,
  279,
  144,
  225,
  154,
  210,
  319,
  57,
  194,
  294,
  233,
  178,
  95,
  126,
  101,
  98,
  312,
  64,
  101,
  269,
  266,
  56,
  303,
  161,
  247,
  245,
  112,
  34,
  82,
  192,
  136,
  140,
  32,
  31,
  72,
  72,
  46,
  9,
  28,
  33,
  74,
  89,
  36,
  66,
  34,
  74,
  58,
  119,
  105,
  241,
  290,
  89,
  224,
  128,
  151,
  148,
  30,
  117,
  340,
  299,
  237,
  107,
  264,
  82,
  89,
  291,
  182,
  122,
  72,
  207,
  243,
  318,
  292,
  272,
  369,
  193,
  177,
  210,
  112,
  185,
  160,
  253,
  312,
  71,
  687,
  453,
  161,
  57,
  158,
  31,
  231,
  154,
  104,
  63,
  363,
  129,
  307,
  169,
  42,
  161,
  339,
  198,
  107,
  131,
  208,
  224,
  177,
  308,
  162,
  46,
  19,
  46,
  164,
  313,
  269,
  251,
  104,
  457,
  200,
  214,
  158,
  225,
  244,
  271,
  371,
  371,
  72,
  122,
  119,
  168,
  127,
  170,
  72,
  64,
  443,
  158,
  377,
  98,
  65,
  86,
  70,
  81,
  53,
  48,
  73,
  51,
  93,
  84,
  56,
  93,
  63,
  81,
  39,
  39,
  56,
  76,
  17,
  64,
  40,
  56,
  34,
  56,
  21,
  82,
  81,
  89,
  184,
  198,
  83,
  83,
  104,
  115,
  106,
  76,
  53,
  101,
  66,
  64,
  371,
  197,
  139,
  191,
  235,
  164,
  172,
  141,
  163,
  152,
  171,
  256,
  118,
  70,
  99,
  104,
  65,
];

const useStrengthPredictions = (
  volume: ConditionalVolume,
  exerciseId: number,
  bodystat: Bodystat
) => {
  const [predictions, setPredictions] = useState<undefined | predictions>();
  useEffect(() => {
    if (volume.weight && volume.reps ) {
      const max_one_rm = eliteStrengthBaselines[exerciseId - 1] * (bodystat.isMale ? 1 : 0.57);
      const one_rm = volume.weight * (1 + volume.reps / 30);
      const x = wilks(bodystat.bodymass, one_rm / max_one_rm, bodystat.isMale);
      setPredictions({
        percentile: Math.max(0, Math.min(100, roundToOneDecimalPoint(115471.14623106 * x - 8.801363625876917))),
        oneRepMax: roundToOneDecimalPoint(one_rm),
      });
    } else {
      setPredictions(undefined);
    }
  }, [volume, exerciseId, bodystat]);
  return predictions;
};
export default useStrengthPredictions;