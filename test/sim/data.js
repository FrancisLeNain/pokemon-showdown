'use strict';

const assert = require('./../assert');

describe('Dex data', function () {
	it('should have valid Pokedex entries', function () {
		const Pokedex = Dex.data.Pokedex;
		for (const pokemonid in Pokedex) {
			const entry = Pokedex[pokemonid];
			assert.equal(toID(entry.name), pokemonid, `Mismatched Pokemon key "${pokemonid}" of ${entry.name}`);
			assert(!entry.name.startsWith("-") && !entry.name.endsWith("-"), `Pokemon name "${entry.name}" should not start or end with a hyphen`);
			assert.equal(entry.name, entry.name.trim(), `Pokemon name "${entry.name}" should not start or end with whitespace`);

			assert(entry.color, `Pokemon ${entry.name} must have a color.`);
			assert(entry.heightm, `Pokemon ${entry.name} must have a heightm.`);

			if (entry.forme) {
				// entry is a forme of a base species
				const baseEntry = Pokedex[toID(entry.baseSpecies)];
				assert(baseEntry && !baseEntry.forme, `Forme ${entry.name} should have a valid baseSpecies`);
				assert((baseEntry.otherFormes || []).includes(entry.name), `Base species ${entry.baseSpecies} should have ${entry.name} listed as an otherForme`);
				assert(!entry.otherFormes, `Forme ${entry.baseSpecies} should not have a forme list (the list goes in baseSpecies).`);
				assert(!entry.cosmeticFormes, `Forme ${entry.baseSpecies} should not have a cosmetic forme list (the list goes in baseSpecies).`);
				assert(!entry.baseForme, `Forme ${entry.baseSpecies} should not have a baseForme (its forme name goes in forme) (did you mean baseSpecies?).`);
			} else {
				// entry should be a base species
				assert(!entry.baseSpecies, `Base species ${entry.name} should not have its own baseSpecies.`);
				assert(!entry.changesFrom, `Base species ${entry.name} should not change from anything (its changesFrom forme should be base).`);
				assert(!entry.battleOnly, `Base species ${entry.name} should not be battle-only (its out-of-battle forme should be base).`);
			}

			if (entry.prevo) {
				const prevoEntry = Pokedex[toID(entry.prevo)] || {};
				assert(prevoEntry.evos.includes(entry.name), `Prevo ${entry.prevo} should have ${entry.name} listed as an evo`);
			}
			if (entry.evos) {
				for (const evo of entry.evos) {
					const evoEntry = Pokedex[toID(evo)] || {};
					assert.equal(evo, evoEntry.name, `Misspelled/nonexistent evo "${evo}" of ${entry.name}`);
					assert.notEqual(entry.num, evoEntry.num, `Evo ${evo} of ${entry.name} should have a different dex number`);
					assert.equal(evoEntry.prevo, entry.name, `Evo ${evo} should have ${entry.name} listed as a prevo`);
				}
			}
			if (entry.otherFormes) {
				for (const forme of entry.otherFormes) {
					const formeEntry = Pokedex[toID(forme)] || {};
					assert.equal(forme, formeEntry.name, `Misspelled/nonexistent forme "${forme}" of ${entry.name}`);
					assert.equal(entry.num, formeEntry.num, `Forme ${formeEntry.name} of ${entry.name} should have the same dex number`);
					assert.equal(formeEntry.baseSpecies, entry.name, `Forme ${forme} of ${entry.name} should have it as a baseSpecies`);
					if (!forme.startsWith('Pokestar')) {
						assert(entry.formeOrder !== undefined, `${entry.name} has an otherForme "${forme}" but no formeOrder field`);
						assert(entry.formeOrder.includes(forme), `Forme "${forme}" of ${entry.name} is not included in its formeOrder`);
					}
				}
			}
			if (entry.battleOnly) {
				const battleOnly = Array.isArray(entry.battleOnly) ? entry.battleOnly : [entry.battleOnly];
				for (const battleForme of battleOnly) {
					const battleEntry = Pokedex[toID(battleForme)] || {};
					assert.equal(battleForme, battleEntry.name, `Misspelled/nonexistent battle-only forme "${battleForme}" of ${entry.name}`);
					assert.equal(battleEntry.baseSpecies || battleEntry.name, entry.baseSpecies, `Battle-only forme ${entry.name} of ${battleEntry.name} should have the same baseSpecies`);
					assert(!battleEntry.battleOnly, `Out-of-battle forme ${battleEntry.name} of ${entry.name} should not be battle-only`);
				}
			}
			if (entry.changesFrom) {
				const formeEntry = Pokedex[toID(entry.changesFrom)] || {};
				assert.equal(entry.changesFrom, formeEntry.name, `Misspelled/nonexistent changesFrom value "${entry.changesFrom}" of ${entry.name}`);
				assert.equal(formeEntry.baseSpecies || formeEntry.name, entry.baseSpecies, `Original forme ${formeEntry.name} of ${entry.name} should have the same baseSpecies`);
				assert(!formeEntry.changesFrom, `Original forme ${formeEntry.name} of ${entry.name} should not also have chagesFrom`);
				assert(!formeEntry.battleOnly, `Original forme ${formeEntry.name} of ${entry.name} should not also have battleOnly`);
			}
			if (entry.cosmeticFormes) {
				for (const forme of entry.cosmeticFormes) {
					assert(forme.startsWith(`${entry.name}-`), `Misspelled/nonexistent beginning of cosmetic forme name "${forme}" of ${entry.name}`);
					assert(!forme.endsWith("-"), `Cosmetic forme name "${forme}" of ${entry.name} should not end with a hyphen`);
					assert.equal(forme, forme.trim(), `Cosmetic forme name "${forme}" of ${entry.name} should not start or end with whitespace`);
					if (!forme.startsWith('Pokestar')) {
						assert(entry.formeOrder !== undefined, `${entry.name} has a cosmetic forme "${forme}" but no formeOrder field`);
						assert(entry.formeOrder.includes(forme), `Cosmetic forme name "${forme}" of ${entry.name} is not included in its formeOrder`);
					}
				}
			}
			if (entry.formeOrder) {
				for (const forme of entry.formeOrder) {
					 // formeOrder contains other formes and 'cosmetic' formes which do not have entries in Pokedex but should have aliases
					const formeEntry = Dex.getSpecies(toID(forme));
					assert.equal(forme, formeEntry.name, `Misspelled/nonexistent forme "${forme}" of ${entry.name}`);
					assert(entry.formeOrder.includes(formeEntry.baseSpecies), `${entry.name}'s formeOrder does not contain its base species ${formeEntry.baseSpecies}`);
				}
			}

			const battleOnly = ['Mega', 'Mega-X', 'Mega-Y', 'Primal'].includes(entry.forme) ? entry.baseSpecies : entry.battleOnly;
			if (entry.requiredAbility) {
				assert(entry.battleOnly, `Forme ${entry.name} with requiredAbility must have battleOnly`);
			}
			if (entry.requiredItem) {
				assert(battleOnly || entry.changesFrom, `Forme ${entry.name} with requiredAbility must have battleOnly or changesFrom`);
			}
			if (entry.requiredMove) {
				assert(battleOnly || entry.changesFrom, `Forme ${entry.name} with requiredAbility must have battleOnly or changesFrom`);
			}
		}
	});

	it('should have valid Items entries', function () {
		const Items = Dex.data.Items;
		for (const itemid in Items) {
			const entry = Items[itemid];
			assert.equal(toID(entry.name), itemid, `Mismatched Item key "${itemid}" of "${entry.name}"`);
			assert.equal(typeof entry.num, 'number', `Item ${entry.name} should have a number`);
		}
	});

	it('should have valid Movedex entries', function () {
		const Movedex = Dex.data.Movedex;
		for (const moveid in Movedex) {
			const entry = Movedex[moveid];
			assert.equal(toID(entry.name), moveid, `Mismatched Move key "${moveid}" of "${entry.name}"`);
			assert.equal(typeof entry.num, 'number', `Move ${entry.name} should have a number`);
			assert.false(entry.infiltrates, `Move ${entry.name} should not have an 'infiltrates' property (no real move has it)`);
		}
	});

	it('should have valid Abilities entries', function () {
		const Abilities = Dex.data.Abilities;
		for (const abilityid in Abilities) {
			const entry = Abilities[abilityid];
			assert.equal(toID(entry.name), abilityid, `Mismatched Ability key "${abilityid}" of "${entry.name}"`);
			assert.equal(typeof entry.num, 'number', `Ability ${entry.name} should have a number`);
			assert.equal(typeof entry.rating, 'number', `Ability ${entry.name} should have a rating`);
		}
	});

	it('should have valid Formats entries', function () {
		const Formats = Dex.data.Formats;
		for (const formatid in Formats) {
			const entry = Formats[formatid];
			assert.equal(toID(entry.name), formatid, `Mismatched Format/Ruleset key "${formatid}" of "${entry.name}"`);
		}
	});

	it('should have valid Learnsets entries', function () {
		const Learnsets = Dex.data.Learnsets;
		for (const speciesid in Learnsets) {
			const species = Dex.getSpecies(speciesid);
			assert.equal(speciesid, species.id, `Key "${speciesid}" in Learnsets should be a Species ID`);
			assert(species.exists, `Key "${speciesid}" in Learnsets should be a pokemon`);
			const entry = Learnsets[speciesid];
			for (const moveid in entry.learnset) {
				const move = Dex.getMove(moveid);
				assert.equal(moveid, move.id, `Move key "${moveid}" of Learnsets entry ${species.name} should be a Move ID`);
				assert(move.exists && !move.realMove, `Move key "${moveid}" of Learnsets entry ${species.name} should be a real move`);

				// FIXME: too messy to fix now, will fix later
				if (speciesid === 'zygarde') continue;

				let prevLearnedGen = 10;
				let prevLearnedTypeIndex = -1;
				const LEARN_ORDER = 'MTLREDSVC';
				for (const learned of entry.learnset[moveid]) {
					// See the definition of MoveSource in sim/global-types
					assert(/^[1-8][MTLREDSVC]/.test(learned), `Learn method "${learned}" for ${species.name}'s ${move.name} is invalid`);

					// the move validator uses early exits, so this isn't purely a consistency thing
					// MTL must be before REDSVC, and generations must be ordered newest to oldest
					const learnedGen = parseInt(learned.charAt(0));
					const learnedTypeIndex = LEARN_ORDER.indexOf(learned.charAt(1));
					assert(learnedGen <= prevLearnedGen, `Learn method "${learned}" for ${species.name}'s ${move.name} should be in order from newest to oldest gen`);
					if (learnedGen === prevLearnedGen) {
						assert(learnedTypeIndex >= prevLearnedTypeIndex, `Learn method "${learned}" for ${species.name}'s ${move.name} should be in MTLREDSVC order`);
					}
					prevLearnedGen = learnedGen;
					prevLearnedTypeIndex = learnedTypeIndex;

					switch (learned.charAt(1)) {
					case 'L':
						assert(/^[0-9]+$/.test(learned.slice(2)), `Learn method "${learned}" for ${species.name}'s ${move.name} is invalid: a level-up move should have the level`);
						const level = parseInt(learned.slice(2));
						assert(level >= 0 && level <= 100, `Learn method "${learned}" for ${species.name}'s ${move.name} is invalid: level should be between 0 and 100`);
						break;
					case 'S':
						assert(/^[0-9]+$/.test(learned.slice(2)), `Learn method "${learned}" for ${species.name}'s ${move.name} is invalid: an event move should have the event number`);
						const eventNum = parseInt(learned.slice(2));
						const eventEntry = entry.eventData[eventNum];
						assert(eventEntry, `Learn method "${learned}" for ${species.name}'s ${move.name} is invalid: an event move's event number should be available in entry.eventData`);
						assert(eventEntry.moves.includes(moveid), `Learn method "${learned}" for ${species.name}'s ${move.name} is invalid: an event move's event entry should include that move`);
						break;
					default:
						assert.strictEqual(learned, learned.slice(0, 2), `Learn method "${learned}" for ${species.name}'s ${move.name} is invalid: it should be 2 characters long`);
						break;
					}
				}
			}

			if (entry.eventData) {
				// FIXME: will fix later
				if (speciesid === 'nidoking' || speciesid === 'dracozolt' || speciesid === 'arctozolt' || speciesid === 'dracovish' || speciesid === 'arctovish' || speciesid === 'caribolt' || speciesid === 'pumpkaboosuper' || speciesid === 'zygarde' || speciesid === 'zygarde10') continue;

				if (speciesid.startsWith('pokestar')) continue;
				for (const [i, eventEntry] of entry.eventData.entries()) {
					if (eventEntry.moves) {
						const learned = `${eventEntry.generation}S${i}`;
						for (const eventMove of eventEntry.moves) {
							assert(entry.learnset, `${species.name} has event moves but no learnset`);
							assert(entry.learnset[eventMove].includes(learned), `${species.name}'s event move ${Dex.getMove(eventMove).name} should exist as "${learned}"`);
						}
					}
				}
			}
		}
	});
});
