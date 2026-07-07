package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class MultiplayerPage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    // Lobby
    private final By title = By.xpath("//*[normalize-space()='Multiplayer Arena']");
    private final By createRoomBtn = By.xpath("//button[normalize-space()='+ Create Room']");
    private final By roomCodeInput = By.cssSelector("input[placeholder='Room Code']");
    private final By joinRoomBtn = By.xpath("//button[contains(normalize-space(),'Join Room')]");

    // Room screen
    private final By roomCodeText = By.xpath("//*[contains(normalize-space(),'Room Code:')]/following::span[contains(@class,'font-mono')][1]");


    public MultiplayerPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void waitLobbyLoaded() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(title));
    }

    public void createRoom() {
        wait.until(ExpectedConditions.elementToBeClickable(createRoomBtn)).click();
    }

    public void joinRoom(String code) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(roomCodeInput)).clear();
        driver.findElement(roomCodeInput).sendKeys(code);
        wait.until(ExpectedConditions.elementToBeClickable(joinRoomBtn)).click();
    }

    public String readRoomCode() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(roomCodeText)).getText().trim();
    }




 // add imports


    // locators
    private final By startRaceBtn = By.xpath("//button[contains(normalize-space(),'Start Race')]");
    private final By waitingForHostText = By.xpath("//*[contains(normalize-space(),'Waiting for host to start')]");
    private final By raceTimer = By.xpath("//h2[contains(normalize-space(),'Time:')]");
    private final By resultsWins = By.xpath("//*[contains(normalize-space(),'wins!')]");

    public void startRaceAsHost() {
        wait.until(ExpectedConditions.elementToBeClickable(startRaceBtn)).click();
    }

    public void waitInRoomEitherHostOrGuest() {
        // Host has Start Race button; guest has “Waiting for host…”
        wait.until(d ->
            d.findElements(startRaceBtn).size() > 0 ||
            d.findElements(waitingForHostText).size() > 0
        );
    }

    public void waitRaceStarted() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(raceTimer));
    }

    public void waitResults() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(resultsWins));
    }
}