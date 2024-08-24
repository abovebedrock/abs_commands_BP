//@ts-check
import { commandInit } from "./commandBase";
import { welcomeInit } from "./welcome";
import { fstInit } from "./fst";
import { enchantInit } from "./enchant";
import { coordinateInit } from "./coordinate";
import { messageInit } from "./message";
import { undergroundInit } from "./underground";
import { deathCoordsInit } from "./deathCoords";
import { dayInit } from "./day";
import { tridentInit } from "./trident";
import { aboutInit } from "./about";
import { antiCheatInit } from "./antiCheat/index";
import { lockInit } from "./locks/index";

commandInit();
welcomeInit();
fstInit();
enchantInit();
coordinateInit();
messageInit();
undergroundInit();
deathCoordsInit();
dayInit();
tridentInit();
aboutInit();

antiCheatInit();
lockInit();