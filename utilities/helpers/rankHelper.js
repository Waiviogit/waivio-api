const wObjectModel = require('../../database/schemas/wObjectSchema');

const calculateForWobjects = async (wobjects)=>{   //wobjects - array of objects(author_permlink and weight), calculate for user entity
    await Promise.all(wobjects.map(async (wobject) => {
        const wobj = await wObjectModel.findOne({'author_permlink': wobject.author_permlink}).select('weight').lean();
        let rank = (100 - Math.ceil(Math.pow((wobject.weight / wobj.weight) - 1, 2) * 99));
        if(rank<1){
            rank = 1;
        }
        wobject.rank = rank > 99 ? 99 : rank;
    }));
};

const calculateForUsers = async (users, totalWeight)=>{//users - array of user and weight in specified wobject
    users.forEach(user=>{
        let rank = (100 - Math.ceil(Math.pow((user.weight / totalWeight) - 1, 2) * 99));    //super magic alg
        if(rank<1){
            rank = 1;
        }
        user.rank = rank > 99 ? 99 : rank;
    })
};

module.exports = {calculateForWobjects, calculateForUsers};
