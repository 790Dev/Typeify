<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
 xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">

<html>
<head>
<title>TestNG Report</title>

<style>
table { border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid black; padding: 8px; text-align: center; }
th { background-color: #8bc34a; }
</style>

</head>

<body>

<h2>TestNG Results</h2>

<!-- Summary Table -->
<table>
<tr>
<th>Total Tests</th>
<th>Passed</th>
<th>Failed</th>
<th>Skipped</th>
</tr>

<tr>
<td><xsl:value-of select="count(//test-method[@status='PASS']) 
                        + count(//test-method[@status='FAIL']) 
                        + count(//test-method[@status='SKIP'])"/></td>

<td><xsl:value-of select="count(//test-method[@status='PASS'])"/></td>

<td><xsl:value-of select="count(//test-method[@status='FAIL'])"/></td>

<td><xsl:value-of select="count(//test-method[@status='SKIP'])"/></td>
</tr>

</table>

</body>
</html>

</xsl:template>

</xsl:stylesheet>