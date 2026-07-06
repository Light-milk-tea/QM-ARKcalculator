import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../pages/HomePage.vue";
import SkillLeaderboardPage from "../pages/SkillLeaderboardPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomePage,
    },
    {
      path: "/leaderboard/skills",
      name: "skill-leaderboard",
      component: SkillLeaderboardPage,
    },
  ],
});
