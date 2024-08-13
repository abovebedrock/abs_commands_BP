//@ts-check
import { commandInit } from "./commandBase";
import { loopCommandsInit } from "./loopCommands";
import { coordinateInit } from "./coordinate";
import { dayInit } from "./day";
import { messageInit } from "./message";
import { tridentInit } from "./trident";
import { welcomeInit } from "./welcome";
import { fstInit } from "./fst";
import { debugInit } from "./debug";
import { deathCoordsInit } from "./deathCoords";

commandInit();
welcomeInit();
fstInit();
coordinateInit();
messageInit();
dayInit();
tridentInit();
debugInit();

deathCoordsInit();

loopCommandsInit();