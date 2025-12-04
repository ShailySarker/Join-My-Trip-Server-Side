"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ITrevelStatus = exports.ITrevelInterest = exports.ITravelType = void 0;
var ITravelType;
(function (ITravelType) {
    ITravelType["SOLO"] = "SOLO";
    ITravelType["FAMILY"] = "FAMILY";
    ITravelType["FRIENDS"] = "FRIENDS";
    ITravelType["COUPLE"] = "COUPLE";
})(ITravelType || (exports.ITravelType = ITravelType = {}));
var ITrevelInterest;
(function (ITrevelInterest) {
    ITrevelInterest["HIKING"] = "HIKING";
    ITrevelInterest["BEACH"] = "BEACH";
    ITrevelInterest["CULTURAL"] = "CULTURAL";
    ITrevelInterest["ADVENTURE"] = "ADVENTURE";
    ITrevelInterest["NATURE"] = "NATURE";
    ITrevelInterest["WILDLIFE"] = "WILDLIFE";
    ITrevelInterest["ROAD_TRIPS"] = "ROAD_TRIPS";
    ITrevelInterest["HISTORICAL"] = "HISTORICAL";
    ITrevelInterest["CAMPING"] = "CAMPING";
    ITrevelInterest["NIGHTLIFE_EXPLORATION"] = "NIGHTLIFE_EXPLORATION";
    ITrevelInterest["LUXURY_TRAVEL"] = "LUXURY_TRAVEL";
    ITrevelInterest["CITY_EXPLORATION"] = "CITY_EXPLORATION";
    ITrevelInterest["VILLAGE_LIFE"] = "VILLAGE_LIFE";
    ITrevelInterest["PHOTOGRAPHY"] = "PHOTOGRAPHY";
    ITrevelInterest["FOOD_FESTIVAL"] = "FOOD_FESTIVAL";
    ITrevelInterest["SHOPPING"] = "SHOPPING";
    ITrevelInterest["RELAXATION"] = "RELAXATION";
    ITrevelInterest["INTERNATIONAL"] = "INTERNATIONAL";
})(ITrevelInterest || (exports.ITrevelInterest = ITrevelInterest = {}));
var ITrevelStatus;
(function (ITrevelStatus) {
    ITrevelStatus["UPCOMING"] = "UPCOMING";
    ITrevelStatus["ONGOING"] = "ONGOING";
    ITrevelStatus["COMPLETED"] = "COMPLETED";
    ITrevelStatus["CANCELLED"] = "CANCELLED";
})(ITrevelStatus || (exports.ITrevelStatus = ITrevelStatus = {}));
