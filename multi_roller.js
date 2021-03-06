/*
TODO:
* Put numbers on each card to uniquely identify them.
* Preview/highlight highest initiative actor in each block.
* Enable stepping through initiative.
* Add Player option to track skills.
* Add ability to give monsters ability checkboxes.
* Add ability to give monsters HP.
* Confirm on re-rolling initiative.
* Fix saving.
* Add customizable player initiative slots?
* Sort rows by initiative?
* Allow cookie saving of monsters?
*/

class Roll {
  constructor(num, sides) {
    this.num = num;
    this.sides = sides;
  }

  roll(modifier=0) {
    let rolled_values = []
    let total = 0;
    for (let i = 0; i < this.num; i++) {
      let value = Math.ceil(Math.random() * this.sides);
      total += value;
      rolled_values.push(value);
    }
    total += modifier;
    return new RollResult(total, rolled_values, this._isMax(total, modifier), this._isMin(total, modifier));
  }

  simpleRoll(modifier=0) {
    let total = 0;
    for (let i = 0; i < this.num; i++) {
      let value = Math.ceil(Math.random() * this.sides);
      total += value;
    }
    return total + modifier;
  }


  static rollndn(num, sides, modifier=0) {
    let total = 0;
    for (let i = 0; i < num; i++) {
      let value = Math.ceil(Math.random() * sides);
      total += value;
    }
    return total + modifier;
  }
  max() {
    return this.num * this.sides;
  }

  min() {
    return this.num;
  }

  _isMax(roll_result, modifier) {
    return roll_result === this.max() + modifier;
  }

  _isMin(roll_result, modifier) {
    return roll_result === this.min() + modifier;
  }
}

class RollResult {
  constructor(total, values, is_max, is_min) {
    this.total = total;
    this.values = values;
    this.is_max = is_max;
    this.is_min = is_min;
  }
}

class RollEntry {
  constructor(name, modifier, damage_modifier, health_modifier, health) {
    this.name = name;
    this.modifier = modifier;
    this.damage_modifier = damage_modifier;
    this.health_modifier = health_modifier;
    this.health = health;
  }
}

// TODO: This is quickly just becoming a monster list, and should be renamed as such.
class Rollset {
  constructor(name, roll, initiative_bonus=0, damage_roll=null, health_roll=null) {
    this.name = name;
    this.roll = roll;
    this.initiative_bonus = initiative_bonus;
    this.damage_roll = damage_roll;
    this.health_roll = health_roll;
    this.initiative = null;
    this.health = null;
    this.entries = []
  }

  addEntry(name, modifier, damage_modifier=null, health_modifier=null) {
    let health = 0;
    if (this.hasDamage()) {
      health = this.health_roll.simpleRoll(health_modifier);
    }
    let new_entry = new RollEntry(name, modifier, damage_modifier, health_modifier, health);
    this.entries.push(new_entry);
    return new_entry;
  }

  getEntry(index=null) {
    if (index === null) {
      index = this.entries.length - 1;
    }
    return this.entries[index];
  }

  removeEntry(index) {
    this.entries.splice(index, 1);
  }

  getRollResults() {
    return this._getRollResults(this.roll, this.entries.map(x => x.modifier));
  }

  getDamageRollResults() {
    if (!this.hasDamage()) {
      return null;
    }
    return this._getRollResults(this.damage_roll, this.entries.map(x => x.damage_modifier));
  }

  hasDamage() {
    return this.damage_roll !== null;
  }

  getHealthRollResults() {
    if (!this.hasHealth()) {
      return null;
    }
    return this._getRollResults(this.health_roll, this.entries.map(x => x.health_modifier));
  }

  hasHealth() {
    return this.health_roll !== null;
  }

  numEntries() {
    return this.entries.length;
  }

  _getRollResults(roll, modifiers) {
    let results = []
    for (const modifier of modifiers) {
      results.push(roll.roll(modifier));
    }
    return results;
  }

  rollInitiative() {
    let roll = new Roll(1, 20).roll();
    let initiative = roll.total + this.initiative_bonus;
    this.initiative = initiative;
    return initiative;
  }
}

var rollsets = [];

$(document).ready(function() {

  // $("#add_new_rollset").click(add_rollset);

  let rollset = _add_rollset("roll", "Goblin Attacks", 1, 20);
  _add_roll_to_rollset(rollset, "Goblin Warrior", 10);
  _add_roll_to_rollset(rollset, "Goblin Wizard", -10);

  let rollset2 = _add_rollset("attack", "Goblin Attacks w/ Damage", 1, 20, 3, 2, 8, 2, 10);
  _add_roll_to_rollset(rollset2, "Goblin Warrior", 3, 5);
  _add_roll_to_rollset(rollset2, "Goblin Wizard", -2, -3);

  // add_rollset();
});

let add_rollset = function(e) {
  let rollset_type_input = $("#rollset_builder_type");
  let rollset_name_input = $("#rollset_builder_name");
  let rollset_dice_input = $("#rollset_builder_dice");
  let rollset_sides_input = $("#rollset_builder_sides");
  let rollset_damage_dice_input = $("#rollset_builder_damage_dice");
  let rollset_damage_sides_input = $("#rollset_builder_damage_sides");
  let rollset_health_dice_input = $("#rollset_builder_health_dice");
  let rollset_health_sides_input = $("#rollset_builder_health_sides");
  let rollset_initiative_bonus_input = $("#rollset_builder_initiative_bonus");
  let type = rollset_type_input.val();
  let name = rollset_name_input.val();
  let dice = rollset_dice_input.val();
  let sides = rollset_sides_input.val();
  let damage_dice = rollset_damage_dice_input.val();
  let damage_sides = rollset_damage_sides_input.val();
  let health_dice = rollset_health_dice_input.val();
  let health_sides = rollset_health_sides_input.val();
  let initiative_bonus = rollset_initiative_bonus_input.val();
  rollset_name_input.val("");
  rollset_dice_input.val("");
  rollset_sides_input.val("");
  rollset_damage_dice_input.val("");
  rollset_damage_sides_input.val("");
  rollset_initiative_bonus_input.val("");
  let rollset_index = self.rollsets.length;
  if (!name) {
    name = "Rollset " + String(rollset_index + 1);
  }
  if (!dice) {
    dice = 1;
  }
  if (!sides) {
    sides = 20;
  }
  if (!damage_dice) {
    damage_dice = 2;
  }
  if (!damage_sides) {
    damage_sides = 8;
  }
  if (!health_dice) {
    damage_dice = 1;
  }
  if (!health_sides) {
    damage_sides = 8;
  }
  _add_rollset(type, name, dice, sides, initiative_bonus, damage_dice, damage_sides, health_dice, health_sides);
};

let _add_rollset = function(type, name, dice, sides, initiative_bonus, damage_dice, damage_sides, health_dice, health_sides) {
  let rollset_index = self.rollsets.length;
  let rollset = _add_rollset_obj(type, name, dice, sides, initiative_bonus, damage_dice, damage_sides, health_dice, health_sides);
  return _add_rollset_dom(rollset, rollset_index);
}

var check_enter_rollset = function(event) {
    if (event.keyCode == 13) {
        add_rollset();
    }
}

// TODO: Consider mergine with parent function. This is very short for how many
// variables it makes us pass around.
let _add_rollset_obj = function(type, name, dice, sides, initiative_bonus, damage_dice, damage_sides, health_dice, health_sides) {
  let roll = new Roll(dice, sides);
  let rollgroup = null;
  if (type === "attack") {
    let damage_roll = new Roll(damage_dice, damage_sides);
    let health_roll = new Roll(health_dice, health_sides);
    rollset = new Rollset(name, roll, initiative_bonus, damage_roll, health_roll);
  } else {
    rollset = new Rollset(name, roll);
  }
  rollsets.push(rollset);
  return rollset;
}

let _add_rollset_dom = function(rollset, rollset_index) {
  let rollsets_dom = $("#rollsets");

  let newrollset = $("#rollset_template").clone();
  newrollset.removeAttr("id");
  newrollset.attr("data-index", rollset_index);

  newrollset.find(".rollset_name").text(rollset.name);

  let maybe_plus = rollset.initiative_bonus >= 0 ? "+" : "";
  newrollset.find(".rollset_roll_group_initiative").text(`Group Initiative: ${maybe_plus}${rollset.initiative_bonus}`)

  let roll_summary = newrollset.find(".roll_summary").first();
  let damage_summary = newrollset.find(".damage_summary").first();
  let health_summary = newrollset.find(".health_summary").first();

  let roll_summary_text = `Roll: ${rollset.roll.num}d${rollset.roll.sides}`;
  roll_summary.text(roll_summary_text);
  if (rollset.hasDamage()) {
    let damage_summary_text = `Dmg:  ${rollset.damage_roll.num}d${rollset.damage_roll.sides}`;
    damage_summary.text(damage_summary_text);
    let health_summary_text = `HP:  ${rollset.health_roll.num}d${rollset.health_roll.sides}`;
    health_summary.text(health_summary_text);
  } else {
    damage_summary.css("display", "none");
    newrollset.find(".damage_modifier_input").css("display", "none");
    newrollset.find(".health_modifier_input").css("display", "none");
  }

  let roll_placeholder = _get_roll_placeholder(rollset.hasDamage());
  newrollset.find(".rollset_rolls").first().append(roll_placeholder);

  rollsets_dom.append(newrollset);
  $("#rollsets .remove_row").off("click");
  $("#rollsets .remove_row").click(remove_rollset);
  $("#rollsets .add_roll").off("click");
  $("#rollsets .add_roll").click(add_roll_to_rollset);
  $("#rollsets .roll_button").off("click");
  $("#rollsets .roll_button").click(multiroll);
  $("#rollsets .roll_initiative_button").off("click");
  $("#rollsets .roll_initiative_button").click(rollInitiative);
  $("#rollsets .rollset_roll_group_initiative").off("click");
  $("#rollsets .rollset_roll_group_initiative").click(rollGroupInitiative);
  $("#rollsets .roll_name").off("keypress");
  $("#rollsets .roll_name").keypress(checkEnterRoll);
  $("#rollsets .roll_modifier").off("keypress");
  $("#rollsets .roll_modifier").keypress(checkEnterRoll);

  return newrollset;
};

var add_roll_to_rollset = function(e) {
  let rollset_dom = $(event.target).parents(".rollset");
  let roll_name = rollset_dom.find(".roll_name_input").first().val();
  let roll_modifier = rollset_dom.find(".roll_modifier_input").first().val();
  let damage_modifier = rollset_dom.find(".damage_modifier_input").first().val();
  let health_modifier = rollset_dom.find(".health_modifier_input").first().val();

  _add_roll_to_rollset(rollset_dom, roll_name, roll_modifier, damage_modifier, health_modifier);
}

var _add_roll_to_rollset = function(rollset_dom, name, roll_modifier, damage_modifier='', health_modifier='') {
  roll_modifier = Number(roll_modifier);
  damage_modifier = Number(damage_modifier);
  health_modifier = Number(health_modifier);

  let index = Number(rollset_dom.data("index"));
  let rollset = rollsets[index];

  if (!name) {
    name = "#" + String(rollset.numEntries() + 1);
  }

  let entry = rollset.addEntry(name, roll_modifier, damage_modifier, health_modifier);

  rollset_dom.find(".placeholder").remove();

  let newroll = _get_roll(rollset.hasDamage());
  newroll.removeAttr("id");
  // -1 because we already added this entry.
  newroll.attr("data-index", rollset.numEntries() - 1);
  newroll.find(".roll_name").first().text(name);

  let maybe_plus = roll_modifier >= 0 ? "+" : "";
  roll_modifier = maybe_plus + String(roll_modifier);
  newroll.find(".roll_modifier").text(String(roll_modifier));

  if (rollset.hasDamage()) {
    maybe_plus = damage_modifier >= 0 ? "+" : "";
    damage_modifier = maybe_plus + String(damage_modifier);
    newroll.find(".damage_modifier").text(String(damage_modifier));
    newroll.find(".roll_health_row").text(String(entry.health));
  }

  rollset_dom.find(".rollset_rolls").first().append(newroll);

  $("#rollsets .remove_roll").off("click");
  $("#rollsets .remove_roll").click(remove_roll);

  return newroll;
}

var _get_roll = function(has_damage) {
  let roll = $("#roll_template").clone();
  roll.removeAttr("id");
  if (!has_damage) {
    roll.find(".roll_damage_section").first().css("display", "none");
    roll.find(".roll_health_row").first().css("display", "none");
  }
  return roll;
}

var _get_roll_placeholder = function(has_damage) {
  let roll_placeholder = _get_roll(has_damage);
  roll_placeholder.addClass("placeholder");

  return roll_placeholder;
}

var checkEnterRoll = function(e) {
  if (event.keyCode == 13) {
      add_roll_to_rollset(e);
  }
}

var rollGroupInitiative = function(e) {
  let rollset = $(event.target).parents(".rollset").first();
  let index = Number(rollset.data("index"));
  let initiative = rollsets[index].rollInitiative();
  rollset.find(".rollset_group_initiative").first().text("[" + String(initiative) + "]");
}

var rollInitiative = function(e) {
  let rollset = $(event.target).parents(".rollset").first();
  let index = Number(rollset.data("index"));

  let rolls = rollset.find(".roll");

  let i = 0;
  // Loop over all rollset elements
  $.each(rolls, function(key, value) {
    let element = $(value);
    let initiative = rollsets[index].rollInitiative();
    let initiative_dom = element.find(".roll_individual_initiative").first();
    initiative_dom.text(`[${initiative}]`)
    initiative_dom.css("visibility", "visible");
  });
}

var change_rollset_builder_type = function() {
  let dropdown = $("#rollset_builder_type").first();
  let element = $("#attack_values");
  if (dropdown.val() === "attack") {
    element.css("display", "block");
  } else if (dropdown.val() === "roll") {
    element.css("display", "none");
    element.find("#rollset_builder_damage_dice").first().val('');
    element.find("#rollset_builder_damage_sides").first().val('');
    element.find("#rollset_builder_initiative_bonus").first().val('');
  }

}

// var forEachRollsetEntry = function(cb) {
var setRollColors = function(elem, roll_result) {
  if (roll_result.is_max) {
    elem.css('color', 'red');
  } else if (roll_result.is_min) {
    elem.css('color', 'blue');
  } else {
    elem.css('color', 'black');
  }
}

var multiroll = function(e) {
  let parent = $(event.target).parents(".rollset").first();
  let index = Number(parent.data("index"));
  let rollset = rollsets[index];

  let roll_results = rollset.getRollResults();
  let damage_results = rollset.getDamageRollResults();

  if (roll_results.length === 0) {
    return;
  }

  let high = Math.max(...roll_results.map(x => x.total));
  let low = Math.min(...roll_results.map(x => x.total));

  let rolls = parent.find(".roll");
  let result_rolls = parent.find(".result_div .result.rolls");
  let best_dom = parent.find(".roll_result_container .best").first();
  let worst_dom = parent.find(".roll_result_container .worst").first();

  best_dom.text(String(high));
  worst_dom.text(String(low));

  let i = 0;
  // Loop over all rollset elements
  $.each(rolls, function(key, value) {
    let element = $(value);
    let roll_summary = element.find(".roll_total").first();
    roll_summary.text(roll_results[i].total)
    setRollColors(roll_summary, roll_results[i]);

    let roll_dice = element.find(".roll_rolls").first();
    roll_dice.text(`[${roll_results[i].values}]`);

    if (damage_results !== null) {
      let damage_summary = element.find(".damage_total").first();
      damage_summary.text(damage_results[i].total)
      setRollColors(damage_summary, damage_results[i]);

      let damage_dice = element.find(".damage_rolls").first();
      damage_dice.text(`[${damage_results[i].values}]`);
    }
    i++;
  });
}

var remove_roll = function(e) {
  let parent = $(event.target).parents(".roll");
  let index = Number(parent.data("index"));
  let rollset_dom = parent.parents(".rollset");
  let rollset_index = Number(rollset_dom.data("index"));
  let grandparent = parent.parent();

  let rollset = rollsets[rollset_index];
  rollset.removeEntry(index);

  $.each(rollset_dom.find(".roll"), function(key, value) {
    element = $(value);
    let idx = element.data("index");
    if (idx > index) {
      element.attr("data-index", idx - 1);
    }
  });

  parent.remove();
  if (!grandparent.find(".roll").length === 0) {
    let roll_placeholder = _get_roll_placeholder(rollset.hasDamage());
    grandparent.append(roll_placeholder);
  }
}

var remove_rollset = function(e) {
  if (!confirm("Are you sure you want to remove this rollset?")) {
    return;
  }
  let parent = $(event.target).parents(".rollset");
  let index = Number(parent.data("index"));
  parent.remove();
  rollsets.splice(index, 1)

  $.each($.find(".rollset"), function(key, value) {
    element = $(value);
    let idx = element.data("index");
    if (idx > index) {
      element.attr("data-index", idx - 1);
    }
  });
}

var save_data = function(e) {
  let rollsets = $("#rollsets").find(".rollset");
  let data = [];
  $.each(rollsets, function(key, value) {
    let rollset_data = [];
    let rollset = $(value);
    let rollset_name = rollset.find(".rollset_name").first().text();

    let dice_data = rollset.find(".roll_data").first();
    let dice = dice_data.data("dice");
    let sides = dice_data.data("sides");

    let rolls = rollset.find(".roll");
    $.each(rolls, function(key, value) {
      let roll = $(value);
      let name = roll.find(".name").first().text();
      let modifier = roll.find(".modifier").first().text();
      rollset_data.push({"name": name, "modifier": modifier});
    });
    data.push({"name": rollset_name, "dice": dice, "sides": sides, "rolls": rollset_data});
  });
  $("#data_loader").val(JSON.stringify(data));
}

var load_data = function(e) {
  let data = JSON.parse($("#data_loader").val());
  if (!data) {
    return;
  }
  clear_data();

  for (const rollset_data of data) {
    let rollset = _add_rollset(rollset_data.name, rollset_data.dice, rollset_data.sides);
    for (const roll_data of rollset_data.rolls) {
      let roll = _add_roll_to_rollset(rollset, roll_data.name, roll_data.modifier);
    }
  }
}

var clear_data = function() {
  $("#rollsets").find().remove();
}
