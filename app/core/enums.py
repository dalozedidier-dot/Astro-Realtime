from enum import Enum


class ZodiacType(str, Enum):
    tropical = 'tropical'
    sidereal = 'sidereal'


class HouseSystem(str, Enum):
    whole_sign = 'whole_sign'
    equal = 'equal'


class AspectType(str, Enum):
    conjunction = 'conjunction'
    sextile = 'sextile'
    square = 'square'
    trine = 'trine'
    opposition = 'opposition'


class ChartMode(str, Enum):
    realtime = 'realtime'
    natal = 'natal'
    transit = 'transit'
