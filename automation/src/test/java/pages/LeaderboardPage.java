package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;


public class LeaderboardPage {
    private final WebDriver driver;

    public LeaderboardPage(WebDriver driver) { this.driver = driver; }

    public boolean isVisible() {
        return driver.findElements(By.xpath("//*[contains(normalize-space(),'Leaderboard')]")).size() > 0;
    }

    public void selectDuration(int seconds) {
        driver.findElement(By.xpath("//button[contains(normalize-space(),'time " + seconds + "')]")).click();
    }
    public void waitVisible(WebDriverWait wait) {
        wait.until(d -> isVisible());
    }
}