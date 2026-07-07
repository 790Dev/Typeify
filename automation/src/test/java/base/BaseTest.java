package base;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.safari.SafariDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.ITestResult;
import org.testng.annotations.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

public class BaseTest {
    protected WebDriver driver;
    protected WebDriverWait wait;

    protected String baseUrl = System.getProperty("baseUrl", "http://localhost:5173");

    // chrome | safari
    protected String browser = System.getProperty("browser", "chrome");

    // default FALSE so you can see browser opening
    protected boolean headless = Boolean.parseBoolean(System.getProperty("headless", "false"));

    @BeforeClass
    public void setupClass() {
        if ("chrome".equalsIgnoreCase(browser)) {
            WebDriverManager.chromedriver().setup();
        }
    }

    @BeforeMethod
    public void setup() {
        if ("safari".equalsIgnoreCase(browser)) {
            // Safari needs: sudo safaridriver --enable
            // and Safari -> Develop -> Allow Remote Automation
            driver = new SafariDriver();
        } else {
            ChromeOptions options = new ChromeOptions();
            if (headless) options.addArguments("--headless=new");
            options.addArguments("--window-size=1400,900", "--disable-gpu", "--no-sandbox");
            driver = new ChromeDriver(options);
        }

        wait = new WebDriverWait(driver, Duration.ofSeconds(20));
    }

    @AfterMethod(alwaysRun = true)
    public void teardown(ITestResult result) {
        try {
            if (!result.isSuccess()) screenshot(result.getName());
        } catch (Exception ignored) {
        }
        // DO NOT driver.quit();  (keeps Chrome open)
    }

    private void screenshot(String testName) throws Exception {
        byte[] png = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
        Path outDir = Path.of("target", "screenshots");
        Files.createDirectories(outDir);
        Files.write(outDir.resolve(testName + ".png"), png);
    }
    
    @AfterSuite(alwaysRun = true)
    public void keepBrowserOpen() throws Exception {
        System.out.println("Keeping Chrome open. Press ENTER to exit...");
        System.in.read();  // wait for Enter
    }
}