"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IUserGender = exports.IUserRole = exports.IProvider = void 0;
var IProvider;
(function (IProvider) {
    IProvider["GOOGLE"] = "GOOGLE";
    IProvider["CREDENTIAL"] = "CREDENTIAL";
})(IProvider || (exports.IProvider = IProvider = {}));
var IUserRole;
(function (IUserRole) {
    IUserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    IUserRole["ADMIN"] = "ADMIN";
    IUserRole["USER"] = "USER";
})(IUserRole || (exports.IUserRole = IUserRole = {}));
var IUserGender;
(function (IUserGender) {
    IUserGender["MALE"] = "MALE";
    IUserGender["FEMALE"] = "FEMALE";
})(IUserGender || (exports.IUserGender = IUserGender = {}));
