'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AIQuestionnaireAnswers } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import jsPDF from 'jspdf'
import html2canvas from "html2canvas"
import { useReactToPrint } from 'react-to-print'

const ReportDescription = ({ assessmentId, aiAnalysis }: { assessmentId: string; aiAnalysis: AIQuestionnaireAnswers }) => {
	console.log(aiAnalysis)
	const router = useRouter()
	const reportRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!assessmentId) {
			toast('Missing Assessment ID', {
				description: 'Please provide an assessment ID to view the report.',
			})
			router.push('/')
			return
		}
	}, [assessmentId, router, toast])

	
// const handleDownload = async () => {
//   if (!reportRef.current) {
//     console.error("Report container not found!");
//     return;
//   }

//   try {
//     const html2canvas = (await import("html2canvas")).default;
//     const { default: jsPDF } = await import("jspdf");

//     const elements = reportRef.current.querySelectorAll("*");
//     const originalStyles: { el: HTMLElement; color: string; backgroundColor: string }[] = [];

//     elements.forEach((el) => {
//       const computedStyle = window.getComputedStyle(el);

//       // Replace unsupported 'oklch' colors with fallback
//       const safeColor = (c: string) => (c.includes("oklch") ? "rgb(0,0,0)" : c);
//       const safeBg = (bg: string) => (bg.includes("oklch") ? "rgb(255,255,255)" : bg);

//       originalStyles.push({
//         el,
//         color: el.style.color,
//         backgroundColor: el.style.backgroundColor,
//       });

//       el.style.color = safeColor(computedStyle.color);
//       el.style.backgroundColor = safeBg(computedStyle.backgroundColor);
//     });

//     // Wait a tick for styles to apply
//     await new Promise(r => setTimeout(r, 50));

//     const canvas = await html2canvas(reportRef.current, {
//       useCORS: true,
//       scale: 2,
//       scrollX: -window.scrollX,
//       scrollY: -window.scrollY,
//       windowWidth: document.documentElement.clientWidth,
//       windowHeight: document.documentElement.clientHeight,
//       logging: false,
//     });

//     // Restore original styles
//     originalStyles.forEach(({ el, color, backgroundColor }) => {
//       el.style.color = color;
//       el.style.backgroundColor = backgroundColor;
//     });

//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF("p", "mm", "a4");
//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

//     let heightLeft = pdfHeight;
//     let position = 0;

//     pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
//     heightLeft -= pdf.internal.pageSize.getHeight();

//     while (heightLeft > 0) {
//       position = heightLeft - pdfHeight;
//       pdf.addPage();
//       pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
//       heightLeft -= pdf.internal.pageSize.getHeight();
//     }

//     pdf.save(`report-${assessmentId}.pdf`);
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     toast.error("Something went wrong while generating the PDF.");
//   }
// };



  const handlePrint = useReactToPrint({
  contentRef: reportRef,
  documentTitle: `report-${assessmentId}`,
  onAfterPrint: () => toast.success('Report download initiated!'),
})


	return (
		<div className="container mx-auto p-4 space-y-4" >
			<div className="flex justify-end">
        <Button onClick={handlePrint} className="mb-4">
          Download Report
        </Button>
      </div>
            <div ref={reportRef}>
			<Card>
				<CardHeader>
					<CardTitle>Summary & Recommendations</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="font-semibold text-lg">User Summary</h3>
						<p>{aiAnalysis?.userSummary}</p>
					</div>
					{/* <Separator /> */}
					<div>
						<h3 className="font-semibold text-lg">Overall Suitability</h3>
						<p>{aiAnalysis?.overallSuitability}</p>
					</div>
					{/* <Separator /> */}
					<div>
						<h3 className="font-semibold text-lg">Areas for Improvement</h3>
						<div>
							<ul>
								{aiAnalysis?.areasForImprovement.split('\n').map((item, index) => (
									<li key={index}>{item}</li>
								))}
							</ul>
						</div>
					</div>
					<Separator />
					<div>
						<h3 className="font-semibold text-lg">Improvement Suggestions</h3>
						<p>{aiAnalysis?.improvementSuggestions}</p>
					</div>
					<Separator />
					<div>
						<h3 className="font-semibold text-lg">Feedback</h3>
						<p>{aiAnalysis?.feedback}</p>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Assessment Metrics</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<div className="flex justify-between mb-1">
								<span>Predictive Index</span>
								<span>
									{/* this was out of 5 initially like 2/5 */}
									{aiAnalysis?.averagePredictiveIndex * 20}/{5 * 20}
									{/* {aiAnalysis?.averagePredictiveIndex}/{5} */}
								</span>
							</div>
							<Progress max={100} value={aiAnalysis.averagePredictiveIndex! * 20} className="h-2" />
						</div>
						<div>
							<div className="flex justify-between mb-1">
								<span>Emotional Intelligence</span>
								<span>
									{aiAnalysis?.averageEmotionalIntelligence * 20}/{5 * 20}
									{/* {aiAnalysis?.averageEmotionalIntelligence}/{5} */}
								</span>
							</div>
							<Progress max={100} value={aiAnalysis.averageEmotionalIntelligence * 20} className="h-2" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Strengths</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{aiAnalysis?.strengths.map((strength, index) => (
								<Badge key={index} className="px-3 py-1 text-wrap!">
									{strength}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Candidate Overview</CardTitle>
					<CardDescription>Overall overview of the candidate</CardDescription>
				</CardHeader>
				<CardContent>{aiAnalysis?.candidateOverview}</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Question & Answer Details</CardTitle>
					<CardDescription>Responses provided during the assessment</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{aiAnalysis?.answersWithQuestions.map((qa, index) =>
							qa && typeof qa === 'object' && 'question' in qa && 'answer' in qa ? (
								<Card key={index} className="mb-6">
									<CardHeader>
										<div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm mb-2">
											{qa.category === 'expertise' ? 'Professional Expertise' : 'Work Behavior'}
										</div>
										<CardTitle>{String(qa.question)}</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="border-l-4 border-primary pl-4 py-2">
											{qa.type === 'multiple_choice' ? (
												<div className="flex items-center space-x-2 rounded-md border p-3 bg-muted/50">
													<div className="h-4 w-4 rounded-full bg-primary"></div>
													<span>{String(qa.answer)}</span>
												</div>
											) : (
												<div className="rounded-md border p-3 bg-muted/50 min-h-[100px]">{String(qa.answer)}</div>
											)}
										</div>
									</CardContent>
								</Card>
							) : null
						)}
					</div>
				</CardContent>
			</Card>
			</div>
		</div>
	)
}

export default ReportDescription
