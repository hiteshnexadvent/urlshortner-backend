import userMong from "../models/User_Mong.js";

const checkPlanExpiry = async (req, res, next) => {
    if (!req.session.userEmail || !req.session.userEmail.email) {
    return next();
  }

  try {
    const email = req.session.userEmail.email;
      const user = await userMong.findOne({ email: req.session.userEmail.email });
      console.log(user);

    if (user && user.plan !== "Basic" && user.planStartDate) {
      const now = new Date();
      const planDate = new Date(user.planStartDate);
      const diffMinutes = Math.floor((now - planDate) / (1000 * 60)); 

      if (diffMinutes >= 1) {  // ⏱️ Expire after 1 minute
        user.plan = "Basic";
        user.planStartDate = null;
        await user.save();
      }
    }
  } catch (error) {
    console.error("Error in plan expiry middleware:", error);
  }

  next();
};

export default checkPlanExpiry;
