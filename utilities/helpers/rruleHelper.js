const { RRule } = require('rrule');

const getNextEventDate = (rrule) => {
  try {
    const rule = RRule.fromString(rrule);
    const nextDate = rule.after(new Date());
    return nextDate ? nextDate.toISOString() : '';
  } catch (error) {
    return '';
  }
};

const getNextClosestDate = (rrules) => {
  const now = new Date();
  let closestDate = null;

  for (const rrule of rrules) {
    try {
      const rule = RRule.fromString(rrule);
      const nextDate = rule.after(now);
      if (nextDate && (!closestDate || nextDate < closestDate)) {
        closestDate = nextDate;
      }
    } catch (error) {
      continue;
    }
  }

  return closestDate ? closestDate.toISOString() : '';
};

module.exports = {
  getNextClosestDate,
  getNextEventDate,
};
