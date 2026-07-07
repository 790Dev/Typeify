package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
public class AuthModalPage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    private final By modalOverlay = By.cssSelector(".fixed.inset-0.z-50");
    private final By tabSignup = By.xpath("//button[normalize-space()='Signup']");
    private final By username = By.cssSelector("input[placeholder='Username']");
    private final By email = By.cssSelector("input[placeholder='Email']");
    private final By password = By.cssSelector("input[placeholder='Password']");
    private final By signupBtn = By.xpath("//form//button[normalize-space()='Signup']");

    public AuthModalPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void signup(String u, String e, String p) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(modalOverlay));
        wait.until(ExpectedConditions.elementToBeClickable(tabSignup)).click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(username)).sendKeys(u);
        driver.findElement(email).sendKeys(e);
        driver.findElement(password).sendKeys(p);

        wait.until(ExpectedConditions.elementToBeClickable(signupBtn)).click();

        // IMPORTANT: wait until modal closes (auto-login completes)
        wait.until(ExpectedConditions.invisibilityOfElementLocated(modalOverlay));
    }
}