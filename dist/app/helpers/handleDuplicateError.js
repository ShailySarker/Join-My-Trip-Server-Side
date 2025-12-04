"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlerDuplicationError = void 0;
const handlerDuplicationError = (err) => {
    const matchedArray = err.message.match(/"([^"]*)"/);
    return {
        statusCode: 400,
        message: `${matchedArray[1]} already exists!`
    };
};
exports.handlerDuplicationError = handlerDuplicationError;
