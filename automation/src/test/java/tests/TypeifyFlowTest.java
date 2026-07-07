package tests;

import base.BaseTest;
import org.testng.annotations.Test;
import pages.*;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;

import java.util.UUID;

import java.nio.file.Files;
import java.nio.file.Path;


public class TypeifyFlowTest extends BaseTest {
	
	 private String randomUser() {
	        return "e2e_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
	    }

	    private void signupAndLogin(WebDriver d, WebDriverWait w) {
	        d.get(baseUrl);

	        NavBarPage nav = new NavBarPage(d, w);
	        AuthModalPage auth = new AuthModalPage(d, w);

	        nav.openLoginModal();

	        String u = randomUser();
	        String e = u + "@example.com";
	        String p = "TestPass123!";

	        auth.signup(u, e, p);
	        nav.waitLoggedIn();
	    }

	    private void doTypingFor15Seconds(WebDriver d, WebDriverWait w) throws Exception {
	        TypingPage typing = new TypingPage(d, w);
	        typing.selectTime(15);
	        typing.typeForTime(15);
	        typing.waitResultPage();
	    }

    @Test
    public void login_type_dashboard_leaderboard() throws Exception {
        driver.get(baseUrl);

        NavBarPage nav = new NavBarPage(driver, wait);
        AuthModalPage auth = new AuthModalPage(driver, wait);

        // UPDATED: pass wait to TypingPage
        TypingPage typing = new TypingPage(driver, wait);

        ProfilePage profile = new ProfilePage(driver);
        LeaderboardPage leaderboard = new LeaderboardPage(driver);

        // Signup (auto-login)
        nav.openLoginModal();

        String u = "e2e_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        String e = u + "@example.com";
        String p = "TestPass123!";

        auth.signup(u, e, p);

        // Wait until Profile icon appears
        nav.waitLoggedIn();

        // UPDATED: select 15s, type exactly what is shown for ~15s, then wait for result page
        typing.selectTime(15);
        typing.typeForTime(15);
        typing.waitResultPage();

        // Dashboard/Profile
        nav.openProfile();
        profile.waitVisible(wait);

        // Leaderboard
        profile.clickViewLeaderboard();
        leaderboard.waitVisible(wait);
        leaderboard.selectDuration(15);

            // Player 1 uses existing driver from BaseTest
        NavBarPage nav1 = new NavBarPage(driver, wait);



        Path profile2 = Files.createTempDirectory("typeify-player2-");

        ChromeOptions opt2 = new ChromeOptions();
        opt2.addArguments("--window-size=1200,800");
        opt2.addArguments("--user-data-dir=" + profile2.toAbsolutePath());
        opt2.addArguments("--profile-directory=Default");
        // keep it visible
        // (do NOT add headless args)

        WebDriver driver2 = new ChromeDriver(opt2);
            // --- Player 2 driver with separate profile (fixes blank data: page) ---

        WebDriverWait wait2 = new WebDriverWait(driver2, Duration.ofSeconds(20));

            try {
                // Player 2 open app first (avoid late socket auth issues)
                driver2.get(baseUrl);

                // Login/signup Player 2
                NavBarPage nav2 = new NavBarPage(driver2, wait2);
                AuthModalPage auth2 = new AuthModalPage(driver2, wait2);

                nav2.openLoginModal();
                String u2 = "e2e_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
                String e2 = u2 + "@example.com";
                String p2 = "TestPass123!";
                auth2.signup(u2, e2, p2);
                nav2.waitLoggedIn();

                // Player 1 go Multiplayer + create room
                nav1.openMultiplayer();
                MultiplayerPage mp1 = new MultiplayerPage(driver, wait);
                mp1.waitLobbyLoaded();
                mp1.createRoom();

                // Read room code shown in the Room screen
                String code = mp1.readRoomCode();

                // Player 2 go Multiplayer + join using code
                nav2.openMultiplayer();
                MultiplayerPage mp2 = new MultiplayerPage(driver2, wait2);
                mp2.waitLobbyLoaded();
                mp2.joinRoom(code);

                // Start race by host (Player 1)

                
             // both should be in waiting room
                mp1.waitInRoomEitherHostOrGuest();
                mp2.waitInRoomEitherHostOrGuest();

                // HOST starts race
                mp1.startRaceAsHost();

                // both must reach race screen
                mp1.waitRaceStarted();
                mp2.waitRaceStarted();

                // both type for 15 seconds
                TypingPage t1 = new TypingPage(driver, wait);
                TypingPage t2 = new TypingPage(driver2, wait2);

                t1.typeRaceForSeconds(15);
                t2.typeRaceForSeconds(15);

                // both must see results "{winner} wins!"
                mp1.waitResults();
                mp2.waitResults();

            } finally {
                //driver2.quit();// close player 2 (remove if you want it to stay open)
            }
            
        }
  
    @Test(priority=2)
    public void signup_and_type_15s_shows_result() throws Exception {
        signupAndLogin(driver, wait);
        doTypingFor15Seconds(driver, wait);
    }

    @Test(priority=1)
    public void profile_to_leaderboard_duration_15_loads() throws Exception {
        signupAndLogin(driver, wait);
        doTypingFor15Seconds(driver, wait);

        NavBarPage nav = new NavBarPage(driver, wait);
        ProfilePage profile = new ProfilePage(driver);
        LeaderboardPage leaderboard = new LeaderboardPage(driver);

        nav.openProfile();
        profile.waitVisible(wait);

        profile.clickViewLeaderboard();
        leaderboard.waitVisible(wait);
        leaderboard.selectDuration(15);
    }

        @Test
        public void multiplayer_two_players_race_15s_reaches_results() throws Exception {
            // Player 1
            signupAndLogin(driver, wait);

            NavBarPage nav1 = new NavBarPage(driver, wait);
            MultiplayerPage mp1;

            // Player 2 (separate Chrome profile)
            Path profile2 = Files.createTempDirectory("typeify-player2-");

            ChromeOptions opt2 = new ChromeOptions();
            opt2.addArguments("--window-size=1200,800");
            opt2.addArguments("--user-data-dir=" + profile2.toAbsolutePath());
            opt2.addArguments("--profile-directory=Default");

            WebDriver driver2 = new ChromeDriver(opt2);
            WebDriverWait wait2 = new WebDriverWait(driver2, Duration.ofSeconds(20));

            try {
                signupAndLogin(driver2, wait2);

                // Player 1 create room
                nav1.openMultiplayer();
                mp1 = new MultiplayerPage(driver, wait);
                mp1.waitLobbyLoaded();
                mp1.createRoom();
                String code = mp1.readRoomCode();

                // Player 2 join room
                NavBarPage nav2 = new NavBarPage(driver2, wait2);
                nav2.openMultiplayer();
                MultiplayerPage mp2 = new MultiplayerPage(driver2, wait2);
                mp2.waitLobbyLoaded();
                mp2.joinRoom(code);

                // Both in room
                mp1.waitInRoomEitherHostOrGuest();
                mp2.waitInRoomEitherHostOrGuest();

                // Host starts race
                mp1.startRaceAsHost();

                // Both reach race screen
                mp1.waitRaceStarted();
                mp2.waitRaceStarted();

                // Both type for 15 seconds
                TypingPage t1 = new TypingPage(driver, wait);
                TypingPage t2 = new TypingPage(driver2, wait2);

                t1.typeRaceForSeconds(15);
                t2.typeRaceForSeconds(15);

                // Both see results
                mp1.waitResults();
                mp2.waitResults();
            } finally {
                driver2.quit();
            }
        }
    }
