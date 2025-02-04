import { CompositeCost, CustomCost, ExponentialCost, FirstFreeCost, FreeCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { parseBigNumber, BigNumber } from "./api/BigNumber";
import { theory } from "./api/Theory";
import { Utils } from "./api/Utils";

var id = "fractional_integration_no_beta";
var name = "Fractional Integration NO Beta";
var description = "The functions between a function and its derivative have many ways of being shown, this is one of them."+
                    "Fractional integration is a way to calculate what is between a function and its integral and is a smooth transition."+
                    "As such, as a fractional integral approaches 1, it should become the integral.";
var authors = "Snaeky (SnaekySnacks#1161) - Idea\nGen (Gen#3006) - Coding\nXLII (XLII#0042) - Balancing";
var version = 1;
var releaseOrder = "6";

var rho_dot = BigNumber.ZERO;
var t_cumulative = BigNumber.ZERO;

// lambda = 1 - 1/2^k
// lambda = 1 - `lambda_man`e`lambda_exp` 
// 1/2^k in xxxe-xxx form
//man =  10^((log(1)-k*log(2)) - exp)
//exp = floor(log(1) - k*log(2))
var lambda_man = BigNumber.ZERO;
var lambda_exp = BigNumber.ZERO;

//used for approx calculation
var lambda_base = BigNumber.TWO;

//ID - f(x)
//0 - cos(x)
//1 - sin(x)
//2 - log10(1+x)    
//3 - e^x 

var q = BigNumber.ZERO;
var r = BigNumber.ZERO;

var update_divisor = true;

var q1, t, m, n;
var q2A, q2B, q2C, q2D;
var kA, kB, kC;
var intUnlock, kUnlock, q1Exp, UnlTerm, fxUpg, baseUpg;

var popup = ui.createPopup({
    title: "f(x) Milestone",
    content: ui.createStackLayout({
        children: [                       
            ui.createLabel({text: "Buying or Refunding a f(x) milestone will reset q",horizontalOptions: LayoutOptions.CENTER}),
            ui.createButton({text: "Close", onClicked: () => popup.hide()})
        ]
    })
});

var init = () => {
    currency = theory.createCurrency();

    ///////////////////
    // Regular Upgrades
    
    //t
    {
        let getDesc = (level) => "\\dot{t}=" + getT(level).toString(1);
        let getInfo = (level) => "\\dot{t}=" + getT(level).toString(1);
        t = theory.createUpgrade(0, currency, new ExponentialCost(1e25, Math.log2(1e50)));
        t.getDescription = (amount) => Utils.getMath(getDesc(t.level));
        t.getInfo = (amount) => Utils.getMathTo(getInfo(t.level), getInfo(t.level + amount));
        t.maxLevel=4;
    }

    // q1
    {
        let getDesc = (level) => "q_1=" + getQ1(level).toString(0);
        let getInfo = (level) => "q_1=" + getQ1(level).toString(0);
        q1 = theory.createUpgrade(1, currency, new FirstFreeCost(new ExponentialCost(20, Math.log2(12.645))));
        q1.getDescription = (amount) => Utils.getMath(getDesc(q1.level));
        q1.getInfo = (amount) => Utils.getMathTo(getInfo(q1.level), getInfo(q1.level + amount));
    }

    //q2A
    {
        let getDesc = (level) => "q_2=2^{" + level+"}";
        let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
        q2A = theory.createUpgrade(2, currency, new ExponentialCost(1e7, Math.log2(5e3)));
        q2A.getDescription = (amount) => Utils.getMath(getDesc(q2A.level));
        q2A.getInfo = (amount) => Utils.getMathTo(getInfo(q2A.level), getInfo(q2A.level + amount));
    }

    //q2B
    {
        let getDesc = (level) => "q_2=2^{" + level+"}";
        let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
        q2B = theory.createUpgrade(3, currency, new ExponentialCost(1e7, Math.log2(3e3)));
        q2B.getDescription = (amount) => Utils.getMath(getDesc(q2B.level));
        q2B.getInfo = (amount) => Utils.getMathTo(getInfo(q2B.level), getInfo(q2B.level + amount));
    }

    //q2C
    {
        let getDesc = (level) => "q_2=2^{" + level+"}";
        let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
        q2C = theory.createUpgrade(4, currency, new ExponentialCost(1e-10, Math.log2(2.27e3)));
        q2C.getDescription = (amount) => Utils.getMath(getDesc(q2C.level));
        q2C.getInfo = (amount) => Utils.getMathTo(getInfo(q2C.level), getInfo(q2C.level + amount));
    }

    //q2D
    {
        let getDesc = (level) => "q_2=2^{" + level+"}";
        let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
        q2D = theory.createUpgrade(5, currency,  new ExponentialCost(BigNumber.TEN.pow(95), Math.log2(1.08e3)));
        q2D.getDescription = (amount) => Utils.getMath(getDesc(q2D.level));
        q2D.getInfo = (amount) => Utils.getMathTo(getInfo(q2D.level), getInfo(q2D.level + amount));
    }

    //KA
    {
        let getDesc = (level) => "K= " + getK(level).toString(0);
        let getInfo = (level) => "K=" + getK(level).toString(0);
        kA = theory.createUpgrade(6, currency, new ExponentialCost(1e2,Math.log2(10)));
        kA.getDescription = (amount) => Utils.getMath(getDesc(kA.level));
        kA.getInfo = (amount) => Utils.getMathTo(getInfo(kA.level), getInfo(kA.level + amount));
        kA.bought = (_) => update_divisor = true;
        kA.level = 1;
    }

    //KB
    {
        let getDesc = (level) => "K= " + getK(level).toString(0);
        let getInfo = (level) => "K=" + getK(level).toString(0);
        kB = theory.createUpgrade(7, currency, new ExponentialCost(1e-5,Math.log2(37)));
        kB.getDescription = (amount) => Utils.getMath(getDesc(kB.level));
        kB.getInfo = (amount) => Utils.getMathTo(getInfo(kB.level), getInfo(kB.level + amount));
        kB.bought = (_) => update_divisor = true;
        kB.level = 1;
    }

    //KC
    {
        let getDesc = (level) => "K= " + getK(level).toString(0);
        let getInfo = (level) => "K=" + getK(level).toString(0);
        kC = theory.createUpgrade(8, currency, new ExponentialCost(1e-10,Math.log2(95)));
        kC.getDescription = (amount) => Utils.getMath(getDesc(kC.level));
        kC.getInfo = (amount) => Utils.getMathTo(getInfo(kC.level), getInfo(kC.level + amount));
        kC.bought = (_) => update_divisor = true;
        kC.level = 1;
    }

    //M
    {
        let getDesc = (level) => "m= 1.5^{" + level + "}";
        let getInfo = (level) => "m=" + getM(level).toString(0);
        m = theory.createUpgrade(9, currency, new ExponentialCost(1e6, Math.log2(4.44)));
        m.getDescription = (amount) => Utils.getMath(getDesc(m.level));
        m.getInfo = (amount) => Utils.getMathTo(getInfo(m.level), getInfo(m.level + amount));
    }

    //N
    {
        let getDesc = (level) => "n= " + getN(level).toString(0);
        let getInfo = (level) => "n=" + getN(level).toString(0);
        n = theory.createUpgrade(10, currency, new ExponentialCost(1e59, Math.log2(3.75)));
        n.getDescription = (amount) => Utils.getMath(getDesc(n.level));
        n.getInfo = (amount) => Utils.getMathTo(getInfo(n.level), getInfo(n.level + amount));
        n.level = 1;
    }

    /////////////////////
    // Permanent Upgrades
    theory.createPublicationUpgrade(0, currency, 1e8);
    theory.createBuyAllUpgrade(1, currency, 1e15);
    theory.createAutoBuyerUpgrade(2, currency, 1e25);

    {
        perm1 = theory.createPermanentUpgrade(3, currency, new CompositeCost(2,
            new ExponentialCost(1e100,BigNumber.TEN.pow(350).log2()),
            new ExponentialCost(BigNumber.TEN.pow(1050),1)));
        perm1.getDescription = (amount) => "$\\text{Unlock f(x) Milestone lv }$"+(Math.min(perm1.level+1,3));
        perm1.getInfo = (amount) => "$\\text{Unlocks the f(x) Milestone lv }$"+(Math.min(perm1.level+1,3));
        perm1.boughtOrRefunded = (_) => {
            updateAvailability();
            popup.show();
        }
        perm1.maxLevel = 3;
    }

    {
        perm2 = theory.createPermanentUpgrade(4, currency, new ExponentialCost(BigNumber.TEN.pow(350),BigNumber.TEN.pow(400).log2()));
        perm2.getDescription = (amount) => "$\\text{Unlock }\\lambda \\text{ Milestone lv }$"+Math.min((perm2.level+1),2);
        perm2.getInfo = (amount) => "$\\text{Unlocks the }\\lambda \\text{ Milestone lv }$"+Math.min((perm2.level+1),2);
        perm2.boughtOrRefunded = (_) => updateAvailability();
        perm2.maxLevel = 2;
    }


    /////////////////////
    // Checkpoint Upgrades
    theory.setMilestoneCost(new CustomCost(total => BigNumber.from(getMilCustomCost(total))));
    
    {
        intUnlock =  theory.createMilestoneUpgrade(0,1);
        intUnlock.getDescription = (_) => {return "$\\text{Unlock Fractional Integral}$";}
        intUnlock.getInfo = (_) => {return "$\\text{Unlock Fractional Integral}$";}
        intUnlock.boughtOrRefunded = (_) => {updateAvailability();theory.invalidatePrimaryEquation();}
        intUnlock.canBeRefunded = (_) => kUnlock.level == 0;
    }

    {
        kUnlock = theory.createMilestoneUpgrade(1,1);
        kUnlock.getDescription = (_) => {return Localization.getUpgradeAddTermDesc("k");}
        kUnlock.getInfo = (_) => {return Localization.getUpgradeAddTermInfo("k");}
        kUnlock.boughtOrRefunded = (_) => {updateAvailability();theory.invalidateSecondaryEquation();}
        kUnlock.canBeRefunded = (_) => q1Exp.level == 0 && UnlTerm.level == 0 && fxUpg.level == 0 && baseUpg.level == 0;
    }

    {
        q1Exp = theory.createMilestoneUpgrade(2, 3);
        q1Exp.description = Localization.getUpgradeIncCustomExpDesc("q_1", "0.01");
        q1Exp.info = Localization.getUpgradeIncCustomExpInfo("q_1", "0.01");
        q1Exp.boughtOrRefunded = (_) => {theory.invalidateSecondaryEquation();updateAvailability();};
    }

    {
        UnlTerm = theory.createMilestoneUpgrade(3, 2);
        UnlTerm.getDescription = (_) => {
            if(UnlTerm.level == 0) {
                return Localization.getUpgradeAddTermDesc("m");
            }
            return Localization.getUpgradeAddTermDesc("n");
        }
        UnlTerm.getInfo = (_) => { 
            if(UnlTerm.level == 0) {
                return Localization.getUpgradeAddTermInfo("m");
            }
            return Localization.getUpgradeAddTermInfo("n");
        }
        UnlTerm.boughtOrRefunded = (_) => {theory.invalidatePrimaryEquation(); updateAvailability(); };
    }

    {
        fxUpg = theory.createMilestoneUpgrade(4, 3);
        fxUpg.getDescription = (_) => {
            if (fxUpg.level == 0){
                return "$\\text{Approximate }\\sin(x) \\text{ to 3 terms}$";
            }else if (fxUpg.level == 1){
                return "$\\text{Approximate }\\log_{10}(1+x) \\text{ to 5 terms}$";
            }
            return "$\\text{Approximate }e^{x} \\text{ to 6 terms \\& {} Remove / } \\pi \\text{ in Integral limit} $";
        };
        fxUpg.getInfo = (_) => {
            if (fxUpg.level == 0){
                return "$\\text{Change f(x) to } x-\\frac{x^3}{3!}+\\frac{x^5}{5!}$";
            }else if (fxUpg.level == 1){
                return "$\\text{Change f(x) to } (x-\\frac{x^2}{2}+\\frac{x^3}{3}-\\frac{x^4}{4}+\\frac{x^5}{5})/\\ln(10)$";                
            }
            return "$\\text{Change f(x) to } 1+x+\\frac{x^2}{2!}+\\frac{x^3}{3!}+\\frac{x^4}{4!}+\\frac{x^5}{5!} \\text{ \\& {} q/} \\pi \\to q$";

        };
        fxUpg.boughtOrRefunded = (_) => {
            q2A.level = 0;
            q2B.level = 0;
            q2C.level = 0;
            q2D.level = 0;
            
            q = BigNumber.ZERO;          
            theory.invalidatePrimaryEquation();
            theory.invalidateSecondaryEquation();
            updateAvailability();
        }
    }

    {
        baseUpg = theory.createMilestoneUpgrade(5, 2);
        baseUpg.getDescription = (_) => {
            if(baseUpg.level == 0){
                return "$\\text{Improve } \\lambda \\text{ Fraction to } 2/3^{i}$";
            }
            return "$\\text{Improve } \\lambda \\text{ Fraction to } 3/4^{i}$"
        }
        baseUpg.getInfo = (_) => {
            if(baseUpg.level == 0){
                return "$\\text{Improve } \\lambda \\text{ Fraction to } 2/3^{i}$";
            }
            return "$\\text{Improve } \\lambda \\text{ Fraction to } 3/4^{i}$"
        } ;
        baseUpg.boughtOrRefunded = (_) => {
            lambda_base = BigNumber.from(2 + baseUpg.level);
            kA.level = 1;
            kB.level = 1;
            kC.level = 1;
            update_divisor = true;
            theory.invalidateSecondaryEquation();
            theory.invalidateTertiaryEquation();
            updateAvailability();
        }
    }

    //////////////////
    // Story Chapters

    // Story Chapters
    let story_chapter_1 = "While studying some techniques in integration, you think about what it would mean to have a partial derivative or integral...\n"+
    "You remember your friend, a Professor that did some work with Differential and Integral Calculus, and ask them what they thought.\n"+
    "They said, \"oh, I think I saw something about a  'Riemann-Liouville Fractional Derivatives' in a textbook a long time ago.\"\n"+
    "You don't know if it really works, but you want to test it somehow.\nThe equation you make is as follows.";
    theory.createStoryChapter(0, "An Idea", story_chapter_1, () => currency.value >= 1);

    let story_chapter_2 = "Wow, you didn't expect it to work this well!\n"+
    "But, you think it can go faster!\n" +
    "You add a new variable to speed things up.";
    theory.createStoryChapter(1, "Pushing Forwards", story_chapter_2, () => UnlTerm.level > 0);

    let story_chapter_3 = "The m and n upgrades are doing well, but you are getting impatient.\n"+
    "It's taking too long to really show anything concrete.\n"+
    "Sure, ρ is increasing, but it's not enough to really show that this weird looking \"partial\" integral converges to the actual integral...\n"+
    "Maybe changing f(x) will speed things up!";
    theory.createStoryChapter(2, "Converging to the Truth", story_chapter_3, () => perm1.level == 1);

    let story_chapter_4 = "The Professor comes to you and asks how things are going.\n"+
    "You inform them that things are going well, but still very slow.\nYou ask him about any way to speed things up.\n"+
    "\"Why haven't you adjusted the lambda function yet?\n Isn't that sum very slow to converge to 1?\"\n"+
    "Oh yeah!!! Other infinite sums that converge to 1!\n"+
    "You change the lambda function.";
    theory.createStoryChapter(3, "A Lambdmark Discovery", story_chapter_4, () => perm2.level == 1);

    let story_chapter_5 = "Changing the equation again seems to have helped a lot.\n"+
    "You are satisfied with your work and think that you have done your due diligence with showing this conjecture to be true...\n"+
    "The Professor comes up to you and scoffs.\n"+
    "\"Do you really think that you have proven anything yet?\n You'll need bigger numbers than that to really show that it's true.\nYou remember what it took for me to prove my equation?\"\n"+
    "You smile at them and nod... and continue to push.\nMaybe you can add more stuff to make it go faster...";
    theory.createStoryChapter(4, "Insight", story_chapter_5, () => currency.value >= BigNumber.TEN.pow(500));

    let story_chapter_6 = "You're losing faith in what you have so far...\n"+
    "You think back to when your colleague visited you the first time.\n"+
    "Will 3/4 work better than 2/3?";
    theory.createStoryChapter(5, "More of the Same", story_chapter_6, () => perm2.level == 2);

    let story_chapter_7 = "You feel as though f(x) needs something stronger than anything you have given it before.\n"+
    "Every other f(x) you have used has run out of steam and is slowing to a crawl.\n"+
    "What is a really good equation that gets very big, very fast?...\n"+
    "e^x!!!\n"+
    "Of course, it was staring you in the face the whole time.\nThe professor was right earlier on! Why not use his own equation!";
    theory.createStoryChapter(6, "Full Throttle", story_chapter_7, () =>  perm1.level == 3);

    let story_chapter_8 = "Well, you feel as though there aren't any more changes to make.\n"+
    "The Professor comes by once more.\n"+
    "\"Ah, that should do it.\nI see you used my own equation to push things along.\nWhat do you think it will be now?\"\n"+
    "You respond with a smile on your face.\n"+
    "I think we will just have to wait and see.";
    theory.createStoryChapter(7, "EZ Tau Gains Bois!!", story_chapter_8, () => currency.value >= BigNumber.TEN.pow(1150));

    let story_chapter_9 = "You and the Professor are at a conference where you are giving a speech on the equation.\n"+
    "Everyone is impressed by how far you got with brute force.\n"+
    "Some think you won't be able to get much farther.\n"+
    "Yet, you keep pushing.\n\n"+
    "Thank you all for playing this theory so far.\n I had a blast making it and I'm so grateful to Gen and XLII for helping me!\n There is still more τ to gain! Grind on!!\n"+
    "-Snaeky";
    theory.createStoryChapter(8, "Closure", story_chapter_9, () => currency.value >= BigNumber.TEN.pow(1250));

    updateAvailability();
}

var updateAvailability = () => {
    kUnlock.isAvailable = intUnlock.level == 1;
    q1Exp.isAvailable = kUnlock.level == 1;
    UnlTerm.isAvailable = kUnlock.level == 1;
    fxUpg.isAvailable = perm1.level > 0;
    baseUpg.isAvailable = perm2.level > 0;
    perm2.isAvailable = kUnlock.level == 1;
    fxUpg.maxLevel = 0 + perm1.level;
    baseUpg.maxLevel = 0 + perm2.level;

    q2A.isAvailable = fxUpg.level == 0;
    q2B.isAvailable = fxUpg.level == 1;
    q2C.isAvailable = fxUpg.level == 2;
    q2D.isAvailable = fxUpg.level == 3;

    kA.isAvailable = baseUpg.level == 0 && kUnlock.level == 1;
    kB.isAvailable = baseUpg.level == 1 && kUnlock.level == 1;
    kC.isAvailable = baseUpg.level == 2 && kUnlock.level == 1;

    m.isAvailable = UnlTerm.level > 0;
    n.isAvailable = UnlTerm.level > 1;

}

var tick = (elapsedTime, multiplier) => {
    let dt = BigNumber.from(elapsedTime*multiplier); 
    let bonus = theory.publicationMultiplier; 
    let vq1 = getQ1(q1.level).pow(getQ1Exp(q1Exp.level));
    let vq2 = getQ2(Math.max(q2A.level,q2B.level,q2C.level,q2D.level));
    let vt = getT(t.level);
    let vk = getK(Math.max(kA.level,kB.level,kC.level));
    let vm = (UnlTerm.level > 0) ? getM(m.level) : 1;
    let vn = (UnlTerm.level > 1) ? getN(n.level) : 1;

    let vapp = approx(vk,lambda_base);

    if(update_divisor){
        var temp = -vk*lambda_base.log10();
        lambda_exp = Math.floor(temp);
        lambda_man = BigNumber.TEN.pow(temp-lambda_exp);
        update_divisor = false;
    }

    if (q1.level > 0) t_cumulative += vt * dt;
    q += vq1 * vq2 * dt;
    if (q1.level > 0) r += vapp * dt;
    
    if(intUnlock.level == 0){
        rho_dot = vm * vn * t_cumulative * r * (q/BigNumber.PI).pow(BigNumber.ONE/BigNumber.PI);
    }else{
        rho_dot = vm * vn * t_cumulative * norm_int(q/(fxUpg.level < 3 ? BigNumber.PI : BigNumber.ONE)).pow(BigNumber.ONE/BigNumber.PI) * r;
    }
    currency.value += bonus * rho_dot * dt;

    theory.invalidateTertiaryEquation();
}

var getInternalState = () => `${t_cumulative} ${lambda_man} ${lambda_exp} ${lambda_base} ${q} ${r}`;

var setInternalState = (state) => {
    let values = state.split(" ");
    if (values.length > 0) t_cumulative = parseBigNumber(values[0]);
    if (values.length > 1) lambda_man = parseBigNumber(values[1]);
    if (values.length > 2) lambda_exp = parseBigNumber(values[2]);
    if (values.length > 3) lambda_base = parseBigNumber(values[3]);
    if (values.length > 4) q = parseBigNumber(values[4]);
    if (values.length > 5) r = parseBigNumber(values[5]);
    update_divisor = true;
}


//Q2 Cost
var q2Cost1 = new ExponentialCost(1e7, Math.log2(5e3)); //fx == 0 
var q2Cost2 = new ExponentialCost(1e7, Math.log2(3e3)); //fx == 1 
var q2Cost3 = new ExponentialCost(1e-10, Math.log2(2.27e3));//fx == 2
var q2Cost4 = new ExponentialCost(BigNumber.TEN.pow(95), Math.log2(1.08e3));//fx == 3
var q2Costs = [q2Cost1,q2Cost2,q2Cost3,q2Cost4];

//K Cost
var KCost1 = new ExponentialCost(1e2,Math.log2(10));//base == 2
var KCost2 = new ExponentialCost(1e-5,Math.log2(37));//base == 3
var KCost3 = new ExponentialCost(1e-10,Math.log2(95));//base == 4
var KCosts = [KCost1,KCost2,KCost3];

//Milestone Cost
var getMilCustomCost = (level) => {
    //10,20,30,70,210,300,425,530,700,800,950,1150
    switch(level){
        case 0:
            return 1;
        case 1:
            return 2;
        case 2:
            return 3;
        case 3:
            return 7;
        case 4:
            return 17;
        case 5:
            return 30;
        case 6:
            return 42.5;
        case 7:
            return 53;
        case 8:
            return 70;
        case 9:
            return 80;
        case 10:
            return 95;
    }
    return 115;
};


var postPublish = () => {
    t_cumulative = BigNumber.ZERO;
    q = BigNumber.ZERO;
    r = BigNumber.ZERO;
    update_divisor = true;
    kA.level = 1;
    kB.level = 1;
    kC.level = 1;
    n.level = 1;
    updateAvailability();
}

var getPrimaryEquation = () => {
    theory.primaryEquationHeight = 86;
    theory.primaryEquationScale = 1.27;
    let result = "\\begin{matrix}";
    result += "\\dot{\\rho}=tr";
    if(UnlTerm.level > 0) result +="m";
    if(UnlTerm.level > 1) result +="n";
    result += "\\sqrt[\\pi]{";
    if(intUnlock.level == 1) result += "\\int_{0}^{";
    if(fxUpg.level<3){
        result += "q/\\pi"
    }else{
        result += "q";
    }
    if(intUnlock.level == 1) result += "}f(x)dx";
    result += "}\\\\\\\\";
    result += "\\dot{r}=(\\int_{0}^{\\pi}f(x)dx - _{\\lambda}\\int_{0}^{\\pi}f(x)dx^{\\lambda})^{-1}";
    result += "\\end{matrix}";
    return result;
}

var getSecondaryEquation = () => {
    theory.secondaryEquationHeight = 90;
    theory.secondaryEquationScale = 1.2;
    let result = "";
    result += "f(x) = ";
    result += fx_latex();
    result += ",\\quad\\lambda = ";
    if (kUnlock.level == 0){
        result += "\\frac{1}{2}";
    }else{
        result += "\\sum_{i=1}^{K}\\frac{"+(lambda_base-1).toString(0)+"}{"+lambda_base.toString(0)+"^{i}}";
    }
    result += "\\\\\\\\\\qquad";
    if (fxUpg.level==2) result +="\\qquad";
    if (fxUpg.level==3) result +="\\qquad\\qquad";
    result += "\\dot{q}=q_1";
    if (q1Exp.level > 0) result += `^{${1+q1Exp.level*0.01}}`;
    result += "q_2,\\quad"+theory.latexSymbol + "=\\max\\rho^{0.1}";
    result += ""
    return result;
}

var getTertiaryEquation = () => {
    theory.tertiaryEquationScale = 1.1;
    let result = "";
    result += "\\begin{matrix}";
    result += "& 1-\\lambda =";
    if(getK(Math.max(kA.level,kB.level,kC.level)) < 8 && 1/lambda_base.pow(getK(Math.max(kA.level,kB.level,kC.level)))>0.001){
        result += (1/lambda_base.pow(getK(Math.max(kA.level,kB.level,kC.level)))).toString(4);
    }else{
        result += lambda_man.toString(3)+"e"+lambda_exp.toString();
    }

    result += ",&q=";
    result += q.toString();
    result+="\\\\";


    result += "&r=";
    result += r.toString()

    result += ",&t=";
    result += t_cumulative.toString();

    result += "\\end{matrix}";

    return result;
}

//Approximates value for 1/(normal integral - fractional integral) https://www.desmos.com/calculator/ua2v7q9mza
var approx = (k_v,base) => {
    return BigNumber.TEN.pow(-norm_int(BigNumber.PI).log10()-BigNumber.ONE/(BigNumber.E+BigNumber.from(1.519))+k_v*base.log10());
}

//integrates f(x) and returns value with 0 -> limit, as limits
//abs not really needed?
var norm_int = (limit) => {
    switch (fxUpg.level){
        case 0:
            return (limit.pow(5)/120 - limit.pow(3)/6 + limit).abs();
        case 1:
            return (limit.pow(6)/720 - limit.pow(4)/24 + limit.pow(2)/2).abs();
        case 2:
            return ((limit.pow(6)/30 - limit.pow(5)/20 + limit.pow(4)/12 - limit.pow(3)/6 + limit.pow(2)/2)/BigNumber.TEN.log()).abs();
        case 3:
            return limit.pow(6)/720 + limit.pow(5)/120 + limit.pow(4)/24 + limit.pow(3)/6 + limit.pow(2)/2 + limit;
    }
}

//Returns correct latex for each f(x)
var fx_latex = () => {
    switch (fxUpg.level){
        case 0:
            return "1-\\frac{x^2}{2!}+\\frac{x^4}{4!}";
        case 1:
            return "x-\\frac{x^3}{3!}+\\frac{x^5}{5!}";
        case 2:
            return "\\frac{x-\\frac{x^2}{2}+\\frac{x^3}{3}-\\frac{x^4}{4}+\\frac{x^5}{5}}{\\ln(10)}";
        case 3:
            return "1+x+\\frac{x^2}{2!}+\\frac{x^3}{3!}+\\frac{x^4}{4!}+\\frac{x^5}{5!}";
    }
}

var getPublicationMultiplier = (tau) => tau.isZero ? BigNumber.ONE : tau.pow(0.75) * BigNumber.from(5);
var getPublicationMultiplierFormula = (symbol) => "5" + symbol + "^{0.75}";
var getTau = () => currency.value.pow(BigNumber.from(0.1));
var getCurrencyFromTau = (tau) => [tau.max(BigNumber.ONE).pow(10), currency.symbol];
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();

var getT = (level) => BigNumber.from(0.2 + level * 0.2);
var getQ1 = (level) => Utils.getStepwisePowerSum(level, 5, 10, 0);
var getQ2 = (level) => BigNumber.TWO.pow(level);
var getK = (level) => BigNumber.from(level);
var getM = (level) => BigNumber.from(1.5).pow(level);
var getN = (level) => Utils.getStepwisePowerSum(level, 3, 11,0);

var getQ1Exp = (level) => BigNumber.from(1 + level * 0.01);

init();
