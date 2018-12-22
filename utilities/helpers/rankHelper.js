const wObjectModel = require('../../database/schemas/wObjectSchema');


//calculate by Brier Score algorithm
// const calculate = (weight, total) => {
//     return (100 - Math.ceil(Math.pow((weight / total) - 1, 2) * 99))
// };

const calculate = async (wobjects)=>{      //wobjects - array of objects(author_permlink and weight)
    await Promise.all(wobjects.map(async (wobject) => {
        const wobj = await wObjectModel.findOne({'author_permlink': wobject.author_permlink}).select('weight').lean();
        let rank = (100 - Math.ceil(Math.pow((wobject.weight / wobj.weight) - 1, 2) * 99));
        if(rank<1){
            rank = 1;
        }
        wobject.rank = rank > 99 ? 99 : rank;
    }));
};


module.exports = {calculate};
