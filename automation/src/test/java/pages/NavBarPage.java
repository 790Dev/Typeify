package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class NavBarPage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    private final By profileBtn = By.cssSelector("button[title='Profile']");
    private final By loginBtn = By.cssSelector("button[title='Login']");
    private final By leaderboardBtn = By.cssSelector("button[title='Leaderboard']");

    public NavBarPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void openLoginModal() { driver.findElement(loginBtn).click(); }
    public void openProfile() { driver.findElement(profileBtn).click(); }
    public void openLeaderboard() { driver.findElement(leaderboardBtn).click(); }

    public void waitLoggedIn() {
        wait.until(ExpectedConditions.presenceOfElementLocated(profileBtn));
    }
    
    private final By multiplayerBtn = By.cssSelector("button[title='Multiplayer']");

    public void openMultiplayer() {
        driver.findElement(multiplayerBtn).click();
    }
}
