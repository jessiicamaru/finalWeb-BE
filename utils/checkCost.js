export const checkCost = (seat) => {
    if ((0 < seat && seat < 9) || (32 < seat && seat < 41) || (24 < seat && seat < 33) || (56 < seat && seat < 65)) {
        return 450000;
    } else {
        return 350000;
    }
};
