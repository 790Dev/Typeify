package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;


public class ProfilePage {
    private final WebDriver driver;

    private final By logout = By.xpath("//*[contains(normalize-space(),'Logout')]");
    private final By viewLeaderboard = By.xpath("//button[contains(normalize-space(),'View Leaderboard')]");

    public ProfilePage(WebDriver driver) { this.driver = driver; }

    public boolean isVisible() { return driver.findElements(logout).size() > 0; }
    public void clickViewLeaderboard() { driver.findElement(viewLeaderboard).click(); }
    public void waitVisible(WebDriverWait wait) {
        wait.until(d -> isVisible());
    }
}