"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class default_1 {
    /**
     * @inheritDoc
     */
    getDescription() {
        return null;
    }
    /**
     * @inheritDoc
     */
    shouldRun(generator, info) {
        return generator.getBeforeActions(info).length > 0;
    }
    /**
     * @inheritDoc
     */
    exec(generator, info) {
        for (const definition of generator.getBeforeActions(info)) {
            definition.exec(info);
        }
    }
}
exports.default = default_1;