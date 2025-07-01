// @ts-check
import { compareResults } from './compare-benchmark-results.js';

const COMMENT_MARKER = '<!-- performance-test-results -->';

/** @param {import('@actions/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export default async function ciBenchmark({ github, context, core }) {
  try {
    const {
      BASELINE_PATH: baselinePath,
      COMPARE_PATH: comparePath,
      THRESHOLD: threshold,
    } = process.env;

    core.info(
      `Running performance benchmarks.\nBaseline Path: ${baselinePath}\nCompare Path: ${
        comparePath
      }\nThreshold: ${threshold}`,
    );

    const { result, markdown } = await compareResults(baselinePath, comparePath, threshold);

    if (result === 'fail') {
      core.setFailed('Benchmarks changed above threshold.');
    }

    const body = `${COMMENT_MARKER}
            ## 📊 Performance Test Results

            **Status:** ✅ Tests completed  
            **Commit:** ${context.sha}
            **Run:** [${context.runId}](${context.payload.repository.html_url}/actions/runs/${context.runId})

            ${markdown}`;

    const comments = await github.rest.issues.listComments({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
    });

    const existingComment = comments.data.find((/** @type {{ body: string }} */ comment) =>
      comment.body.includes(COMMENT_MARKER),
    );

    if (existingComment) {
      await github.rest.issues.updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: existingComment.id,
        body,
      });
    } else {
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body,
      });
    }
  } catch (/** @type {any} */ e) {
    console.error(e);
    core.setFailed(`Error running performance benchmarks: ${e.message}`);
  }
}
