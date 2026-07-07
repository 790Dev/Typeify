package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;



public class TypingPage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    private final By timer = By.xpath("//h2[contains(normalize-space(),'Time:')]");
    private final By typingTextContainer = By.cssSelector("div.relative.text-3xl"); // UserTypings container
    private final By resultsWpm = By.xpath("//*[normalize-space()='WPM']"); // appears on TypingChart result screen
    private final By raceWordsBox = By.cssSelector("div.text-2xl.leading-relaxed");
    private final By body = By.cssSelector("body");

    public String getRaceWords() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(raceWordsBox)).getText();
    }

    public void typeRaceForSeconds(int seconds) throws Exception {
        long end = System.currentTimeMillis() + seconds * 1000L;

        String words = getRaceWords();
        int i = 0;

        while (System.currentTimeMillis() < end) {
            if (i >= words.length()) {
                words = getRaceWords();
                i = 0;
            }
            driver.findElement(body).sendKeys(String.valueOf(words.charAt(i++)));
            Thread.sleep(30);
        }
    }

    public TypingPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void selectTime(int seconds) {
        driver.findElement(By.xpath("//button[normalize-space()='" + seconds + "']")).click();
    }

    public String getVisibleWords() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(typingTextContainer)).getText();
    }

    public int readTimeLeft() {
        String txt = wait.until(ExpectedConditions.visibilityOfElementLocated(timer)).getText(); // "Time: 15"
        return Integer.parseInt(txt.replaceAll("[^0-9]", ""));
    }

    // Types the currently visible words for ~15 seconds (or until timer hits 0)
    public void typeForTime(int seconds) throws Exception {
        long end = System.currentTimeMillis() + (seconds * 1000L);
        String words = getVisibleWords();
        int i = 0;

        while (System.currentTimeMillis() < end) {
            // stop if timer already ended
            if (readTimeLeft() == 0) break;

            // refresh words if we reached end
            if (i >= words.length()) {
                words = getVisibleWords();
                i = 0;
            }

            char c = words.charAt(i++);
            driver.findElement(By.cssSelector("body")).sendKeys(String.valueOf(c));

            // small delay so it actually runs ~15s (adjust if needed)
            Thread.sleep(35);
        }
    }

    public void waitResultPage() {
        // Result page (TypingChart) shows "WPM" label
        wait.until(ExpectedConditions.visibilityOfElementLocated(resultsWpm));
    }

}