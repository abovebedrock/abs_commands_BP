//@ts-check
import { commandInit } from "./commandBase";
import { welcomeInit } from "./welcome";
import { fstInit } from "./fst";
import { enchantInit } from "./enchant";
import { coordinateInit } from "./coordinate";
import { messageInit } from "./message";
import { deathCoordsInit } from "./deathCoords";
import { dayInit } from "./day";
import { tridentInit } from "./trident";
import { chestlockInit } from "./chestlock";
import { loopCommandsInit } from "./loopCommands";

commandInit();
welcomeInit();
fstInit();
enchantInit();
coordinateInit();
messageInit();
deathCoordsInit();
dayInit();
tridentInit();

chestlockInit();

loopCommandsInit();