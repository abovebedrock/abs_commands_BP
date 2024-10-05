import { commonInit } from "./common";
import { commandInit } from "./commandBase";
import { welcomeInit } from "./welcome";
import { fstInit } from "./fst";
import { enchantInit } from "./enchant";
import { coordinateInit } from "./coordinate";
import { messageInit } from "./message";
import { performanceInit } from "./performance";
import { undergroundInit } from "./underground";
import { deathCoordsInit } from "./deathCoords";
import { dayInit } from "./day";
import { biomeInit } from "./biome";
import { tridentInit } from "./trident";
import { civilInit } from "./civil";
import { aboutInit } from "./about";
import { antiCheatInit } from "./antiCheat/index";
import { lockInit } from "./locks/index";

commonInit();

commandInit();
welcomeInit();
fstInit();
enchantInit();
coordinateInit();
messageInit();
performanceInit();
undergroundInit();
deathCoordsInit();
dayInit();
biomeInit();
tridentInit();
civilInit();
aboutInit();

antiCheatInit();

lockInit();